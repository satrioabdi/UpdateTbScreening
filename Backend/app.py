from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime
from joblib import load
import numpy as np
import logging
import os
from joblib import load

# === Konfigurasi Flask & CORS ===
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# === Logging ===
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()

# === Handler global OPTIONS ===
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response

@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = jsonify({'message': 'OK'})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "Content-Type, Authorization")
    response.headers.add('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS")
    return response, 200

# === Koneksi Database ===
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="screening_tbc"
    )

# === Load Model ===
try:
    base_model_path = os.path.join(os.path.dirname(__file__), 'model')
    model = load(os.path.join(base_model_path, "svm_polynomial_best_model.joblib"))
    scaler = load(os.path.join(base_model_path, "scaler.joblib"))
    pca = load(os.path.join(base_model_path, "pca.joblib"))
    logger.info("Model, scaler, dan PCA berhasil dimuat.")
except Exception as e:
    logger.error(f"Gagal memuat model atau scaler: {e}")
    model, scaler, pca = None, None, None

# === Submit Screening ===
@app.route('/submit-screening', methods=['POST'])
def submit_screening():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        tanggal_raw = data.get('tanggal_screening')
        try:
            if '/' in tanggal_raw:
                tanggal_screening = datetime.strptime(tanggal_raw, "%d/%m/%Y").strftime("%Y-%m-%d")
            else:
                tanggal_screening = tanggal_raw
        except Exception:
            return jsonify({'message': 'Format tanggal tidak valid (gunakan DD/MM/YYYY atau YYYY-MM-DD)'}), 400

        cursor.execute(
            "SELECT id FROM screening WHERE nik = %s AND tanggal_screening = %s",
            (data.get('nik'), tanggal_screening)
        )
        if cursor.fetchone():
            return jsonify({'message': 'Data screening sudah ada untuk tanggal tersebut'}), 409

        data['tanggal_screening'] = tanggal_screening
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        values = list(data.values())

        cursor.execute(f"INSERT INTO screening ({columns}) VALUES ({placeholders})", tuple(values))
        conn.commit()

        return jsonify({'message': 'Screening berhasil disimpan'}), 200

    except Exception as e:
        print("SUBMIT SCREENING ERROR:", str(e))
        return jsonify({'message': 'Terjadi kesalahan saat menyimpan data'}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# === Riwayat Screening ===
@app.route('/riwayat-screening', methods=['GET'])
def riwayat_screening():
    user_id = request.args.get('user_id')
    role = request.args.get('role')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if role == 'admin':
            cursor.execute("SELECT * FROM screening ORDER BY tanggal_screening DESC")
        else:
            cursor.execute("SELECT * FROM screening WHERE user_id = %s ORDER BY tanggal_screening DESC", (user_id,))

        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in rows]

        logger.info(f"Riwayat screening berhasil diambil untuk user: {user_id}")
        return jsonify(results)

    except Exception as e:
        logger.error(f"RIWAYAT SCREENING ERROR: {e}")
        return jsonify({'message': 'Gagal mengambil riwayat'}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# === Hapus Screening ===
@app.route('/hapus-screening/<int:id>', methods=['DELETE'])
def hapus_screening(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM screening WHERE id = %s", (id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'Data tidak ditemukan'}), 404

        return jsonify({'message': 'Data screening berhasil dihapus'}), 200

    except Exception as e:
        logger.error(f"HAPUS SCREENING ERROR: {e}")
        return jsonify({'message': 'Gagal menghapus data screening'}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# === PREDIKSI ===
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if not all([model, scaler, pca]):
            return jsonify({'error': 'Model tidak tersedia'}), 500

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Data tidak valid'}), 400

        features = data.get('features')
        if not features or len(features) != 22:
            return jsonify({'error': 'Input fitur tidak valid (harus 22 fitur)'}), 400

        try:
            features = [float(f) for f in features]
        except (ValueError, TypeError):
            return jsonify({'error': 'Semua fitur harus berupa angka'}), 400

        X = np.array(features).reshape(1, -1)
        X_scaled = scaler.transform(X)
        X_final = pca.transform(X_scaled)

        probability = model.predict_proba(X_final)[0][1]
        prediction = 1 if probability >= 0.5 else 0

        logger.info(f"Prediksi berhasil: {prediction}, probability: {probability}")
        return jsonify({
            'prediction': int(prediction),
            'probability': float(probability)
        })

    except Exception as e:
        logger.error(f"Predict error: {e}")
        return jsonify({'error': 'Terjadi kesalahan dalam prediksi'}), 500

# === Kelola Pengguna ===
@app.route('/kelola-pengguna', methods=['GET'])
def kelola_pengguna():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, username, role FROM users")
        rows = cursor.fetchall()
        users = []
        for row in rows:
            users.append({
                'id': row[0],
                'username': row[1],
                'role': row[2],
            })

        return jsonify(users), 200

    except Exception as e:
        logger.error(f"Kelola Pengguna ERROR: {e}")
        return jsonify({'message': 'Gagal mengambil data pengguna'}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# === Hapus Pengguna ===
@app.route('/hapus-pengguna/<int:id>', methods=['DELETE'])
def hapus_pengguna(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM users WHERE id = %s", (id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'Pengguna tidak ditemukan'}), 404

        return jsonify({'message': 'Pengguna berhasil dihapus'}), 200

    except Exception as e:
        logger.error(f"HAPUS PENGGUNA ERROR: {e}")
        return jsonify({'message': 'Gagal menghapus pengguna'}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username dan password wajib diisi'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Username tidak ditemukan'}), 404

        if user['password'] != password:
            return jsonify({'message': 'Kata sandi salah'}), 401

        return jsonify({
            'user': {
                'user_id': user['id'],
                'username': user['username'],
                'role': user['role']
            }
        }), 200

    except Exception as e:
        logger.error(f"LOGIN ERROR: {e}")
        return jsonify({'message': 'Terjadi kesalahan saat login'}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


# === Register Pengguna ===
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'user')  # default role user

        if not username or not password:
            return jsonify({'message': 'Username dan password wajib diisi'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({'message': 'Username sudah terdaftar'}), 409

        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, password, role)
        )
        conn.commit()

        return jsonify({'message': 'Registrasi berhasil'}), 201

    except Exception as e:
        logger.error(f"REGISTER ERROR: {e}")
        return jsonify({'message': 'Terjadi kesalahan saat menambahkan pengguna'}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

    
# === Jalankan Aplikasi ===
if __name__ == '__main__':
    app.run(debug=True)
