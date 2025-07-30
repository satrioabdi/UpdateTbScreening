import mysql.connector
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from joblib import load
from datetime import datetime
import os
import logging
from mysql.connector import Error
import re

app = Flask(__name__)
CORS(app)

# === KONFIGURASI LOGGING ===
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# === KONFIGURASI DATABASE ===
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'screening_tbc'),
    'autocommit': False,
    'raise_on_warnings': True
}

# === LOAD MODEL & PREPROCESSING ===
try:
    model = load("model/svm_polynomial_best_model.joblib")
    scaler = load("model/scaler.joblib")
    pca = load("model/pca.joblib")
    logger.info("Model berhasil dimuat")
except Exception as e:
    logger.error(f"Gagal memuat model: {e}")
    model = scaler = pca = None

# === FUNGSI UTILITAS ===
def get_db_connection():
    """Membuat koneksi database dengan error handling"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        logger.error(f"Database connection error: {e}")
        raise

def validate_input(data, required_fields):
    """Validasi input data"""
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return False, f"Field berikut wajib diisi: {', '.join(missing_fields)}"
    return True, None

def validate_nik(nik):
    """Validasi format NIK (16 digit)"""
    return re.match(r'^\d{16}$', str(nik)) is not None

def validate_phone(phone):
    """Validasi format nomor telepon"""
    return re.match(r'^[\d\-\+\(\)\s]{10,15}$', str(phone)) is not None

def sanitize_string(value, max_length=255):
    """Sanitasi input string"""
    if not isinstance(value, str):
        value = str(value)
    return value.strip()[:max_length]

# === LOGIN ===
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Data tidak valid'}), 400

        # Validasi input
        is_valid, error_msg = validate_input(data, ['username', 'password'])
        if not is_valid:
            return jsonify({'message': error_msg}), 400

        username = sanitize_string(data.get('username'), 50)
        password = data.get('password')

        # Validasi panjang password
        if len(password) < 1:
            return jsonify({'message': 'Password tidak boleh kosong'}), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        
        # Gunakan parameterized query untuk mencegah SQL injection
        cursor.execute("SELECT id, username, password, role FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        cursor.close()
        db.close()

        if user and user['password'] == password:
            logger.info(f"Login berhasil untuk user: {username}")
            return jsonify({
                'user_id': user['id'],
                'username': user['username'],
                'role': user['role']
            }), 200
        else:
            logger.warning(f"Login gagal untuk user: {username}")
            return jsonify({'message': 'Username atau password salah'}), 401

    except Error as e:
        logger.error(f"Database error pada login: {e}")
        return jsonify({'message': 'Terjadi kesalahan pada server'}), 500
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'message': 'Terjadi kesalahan pada server'}), 500

# === REGISTER ===
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Data tidak valid'}), 400

        # Validasi input
        is_valid, error_msg = validate_input(data, ['username', 'password'])
        if not is_valid:
            return jsonify({'message': error_msg}), 400

        username = sanitize_string(data.get('username'), 50)
        password = data.get('password')
        role = data.get('role', 'user')
        current_user_role = data.get('current_user_role', 'user')

        # Validasi role
        if role not in ['user', 'admin']:
            return jsonify({'message': 'Role tidak valid'}), 400

        if role == 'admin' and current_user_role != 'admin':
            return jsonify({'message': 'Hanya admin yang bisa membuat akun admin'}), 403

        # Validasi panjang password
        if len(password) < 6:
            return jsonify({'message': 'Password minimal 6 karakter'}), 400

        # Validasi username format
        if not re.match(r'^[a-zA-Z0-9_]{3,50}$', username):
            return jsonify({'message': 'Username hanya boleh berisi huruf, angka, underscore (3-50 karakter)'}), 400

        db = get_db_connection()
        cursor = db.cursor()
        
        # Cek apakah username sudah ada
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            db.close()
            return jsonify({'message': 'Username sudah digunakan'}), 400

        # Insert user baru
        cursor.execute(
            "INSERT INTO users (username, password, role, created_at) VALUES (%s, %s, %s, %s)",
            (username, password, role, datetime.now())
        )
        db.commit()
        cursor.close()
        db.close()

        logger.info(f"User baru terdaftar: {username}")
        return jsonify({'message': 'Registrasi berhasil'}), 201

    except Error as e:
        logger.error(f"Database error pada register: {e}")
        return jsonify({'message': 'Terjadi kesalahan pada server'}), 500
    except Exception as e:
        logger.error(f"Register error: {e}")
        return jsonify({'message': 'Terjadi kesalahan pada server'}), 500

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

        # Validasi bahwa semua fitur adalah angka
        try:
            features = [float(f) for f in features]
        except (ValueError, TypeError):
            return jsonify({'error': 'Semua fitur harus berupa angka'}), 400

        # Prediksi
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

# === SIMPAN DATA SCREENING ===
@app.route('/submit-screening', methods=['POST'])
def submit_screening():
    try:
        # Debug: Print raw request data
        raw_data = request.get_data()
        logger.info(f"Raw request data: {raw_data}")
        
        data = request.get_json()
        logger.info(f"Parsed JSON data: {data}")
        
        if not data:
            logger.error("Data tidak valid atau kosong")
            return jsonify({'error': 'Data tidak valid'}), 400

        # Debug: Print semua keys yang ada
        logger.info(f"Keys dalam data: {list(data.keys()) if data else 'None'}")

        # Validasi input wajib
        required_fields = ['user_id', 'nama_pasien', 'nik', 'jenis_kelamin', 
                          'no_hp', 'usia', 'alamat', 'hasil', 'gejala']
        
        missing_fields = []
        for field in required_fields:
            if field not in data or not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            logger.error(f"Missing fields: {missing_fields}")
            return jsonify({'error': f'Field berikut wajib diisi: {", ".join(missing_fields)}'}), 400

        # Ekstrak dan validasi data
        try:
            user_id = int(data['user_id'])
            nama_pasien = str(data['nama_pasien']).strip()[:100]
            nik = str(data['nik']).strip()
            jenis_kelamin = str(data['jenis_kelamin']).strip()
            no_hp = str(data['no_hp']).strip()
            usia = int(data['usia'])
            alamat = str(data['alamat']).strip()[:255]
            hasil = str(data['hasil']).strip()
            probabilitas = float(data.get('probabilitas', 0.0))
            catatan = str(data.get('catatan', '')).strip()[:500]
            gejala = data['gejala']
            tanggal_screening = data.get('tanggal_screening', datetime.now().strftime('%Y-%m-%d'))
            
            logger.info(f"Data extracted successfully - NIK: {nik}, User ID: {user_id}, Hasil: {hasil}")
        except (ValueError, TypeError, KeyError) as e:
            logger.error(f"Error extracting data: {e}")
            return jsonify({'error': f'Format data tidak valid: {str(e)}'}), 400

        # Validasi format NIK (16 digit)
        if not nik.isdigit() or len(nik) != 16:
            logger.error(f"Invalid NIK format: {nik} (length: {len(nik)})")
            return jsonify({'error': f'Format NIK tidak valid. NIK harus 16 digit, diterima: {len(nik)} digit'}), 400

        # Validasi jenis kelamin
        valid_gender = ['Laki-laki', 'Perempuan', 'L', 'P', 'Male', 'Female']
        if jenis_kelamin not in valid_gender:
            logger.error(f"Invalid gender: {jenis_kelamin}")
            return jsonify({'error': f'Jenis kelamin tidak valid. Diterima: "{jenis_kelamin}"'}), 400

        # Validasi hasil
        valid_results = ['Positif', 'Negatif', 'positive', 'negative']
        if hasil not in valid_results:
            logger.error(f"Invalid result: {hasil}")
            return jsonify({'error': f'Hasil screening tidak valid. Diterima: "{hasil}"'}), 400

        # Validasi usia
        if usia < 0 or usia > 150:
            logger.error(f"Invalid age: {usia}")
            return jsonify({'error': f'Usia tidak valid: {usia}'}), 400

        # Validasi gejala
        if not isinstance(gejala, dict):
            logger.error(f"Invalid gejala format: {type(gejala)}")
            return jsonify({'error': f'Format gejala tidak valid. Expected dict, got: {type(gejala)}'}), 400

        # Normalisasi data
        if jenis_kelamin in ['L', 'Male']:
            jenis_kelamin = 'Laki-laki'
        elif jenis_kelamin in ['P', 'Female']:
            jenis_kelamin = 'Perempuan'
            
        if hasil.lower() == 'positive':
            hasil = 'Positif'
        elif hasil.lower() == 'negative':
            hasil = 'Negatif'

        kolom_gejala = [
            'batuk_lebih_2_minggu', 'demam', 'keringat_malam',
            'sesak_nafas', 'nyeri_dada', 'benjolan', 'batuk_berdarah',
            'batuk_kurang_2_minggu', 'nafsu_makan_turun', 'mudah_lelah',
            'bb_turun', 'serumah_sakit_tbc', 'satu_ruangan_tbc',
            'serumah_dengan_tbc', 'tbc_tuntas', 'tbc_tidak_tuntas',
            'diabetes', 'hiv', 'ibu_hamil', 'merokok',
            'usia_0_14', 'lansia'
        ]

        db = get_db_connection()
        cursor = db.cursor()

        try:
            # Cek duplikasi berdasarkan NIK dan tanggal
            cursor.execute(
                "SELECT id FROM screening WHERE nik = %s AND tanggal_screening = %s",
                (nik, tanggal_screening)
            )
            existing = cursor.fetchone()
            if existing:
                logger.warning(f"Duplicate data found for NIK: {nik} on date: {tanggal_screening}")
                return jsonify({'error': 'Data screening untuk NIK ini sudah ada pada tanggal yang sama'}), 409

            # Susun data untuk insert
            values = [
                user_id, tanggal_screening, nama_pasien, nik, jenis_kelamin,
                no_hp, usia, alamat
            ]
            
            # Tambahkan gejala
            for key in kolom_gejala:
                values.append(int(gejala.get(key, 0)))
            
            values.extend([hasil, catatan, probabilitas])

            placeholders = ", ".join(["%s"] * len(values))
            columns = ", ".join([
                "user_id", "tanggal_screening", "nama_pasien", "nik", "jenis_kelamin",
                "no_hp", "usia", "alamat"
            ] + kolom_gejala + ["hasil", "catatan", "probabilitas"])

            logger.info(f"About to insert data with {len(values)} values")
            cursor.execute(f"INSERT INTO screening ({columns}) VALUES ({placeholders})", tuple(values))
            db.commit()

            logger.info(f"Data screening berhasil disimpan untuk NIK: {nik}")
            return jsonify({'message': 'Data screening berhasil disimpan'}), 201

        except Error as e:
            db.rollback()
            logger.error(f"Database error: {e}")
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        finally:
            cursor.close()
            db.close()

    except Exception as e:
        logger.error(f"General error in submit_screening: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# === RIWAYAT SCREENING ===
@app.route('/riwayat-screening', methods=['GET'])
def riwayat_screening():
    try:
        user_id = request.args.get('user_id')
        role = request.args.get('role')

        # Validasi parameter
        if not user_id or not role:
            return jsonify({'error': 'Parameter user_id dan role wajib'}), 400

        if role not in ['user', 'admin']:
            return jsonify({'error': 'Role tidak valid'}), 400

        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({'error': 'User ID tidak valid'}), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        if role == 'admin':
            cursor.execute("""
                SELECT s.*, u.username 
                FROM screening s 
                LEFT JOIN users u ON s.user_id = u.id 
                ORDER BY s.tanggal_screening DESC
            """)
        else:
            cursor.execute("""
                SELECT * FROM screening 
                WHERE user_id = %s 
                ORDER BY tanggal_screening DESC
            """, (user_id,))

        result = cursor.fetchall()
        cursor.close()
        db.close()

        logger.info(f"Riwayat screening berhasil diambil untuk user: {user_id}")
        return jsonify(result), 200

    except Error as e:
        logger.error(f"Database error pada riwayat: {e}")
        return jsonify({'error': 'Terjadi kesalahan pada database'}), 500
    except Exception as e:
        logger.error(f"Riwayat error: {e}")
        return jsonify({'error': 'Terjadi kesalahan pada server'}), 500

# === ERROR HANDLERS ===
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint tidak ditemukan'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method tidak diizinkan'}), 405

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Terjadi kesalahan internal server'}), 500

# === TEST ROUTE ===
@app.route('/')
def index():
    return jsonify({
        'message': 'API Screening TBC aktif',
        'version': '2.0',
        'status': 'OK'
    }), 200

# === HEALTH CHECK ===
@app.route('/health')
def health_check():
    try:
        # Test database connection
        db = get_db_connection()
        db.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'model': 'loaded' if model else 'not_loaded',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# === RUN APP ===
if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(debug=False, port=5000, host='127.0.0.1')  # Debug=False untuk production