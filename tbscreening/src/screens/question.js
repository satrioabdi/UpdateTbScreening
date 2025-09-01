// screens/question.js

export const keluhanQuestions = [
  'Batuk Lebih Dari 2 Minggu',
  'Demam',
  'Berkeringat Malam Hari Tanpa Aktivitas',
  'Sesak Nafas',
  'Nyeri Dada',
  'Ada benjolan di leher/bawah rahang/bawah telinga/ketiak',
  'Batuk berdarah',
  'Batuk kurang dari 2 minggu',
  'Nafsu makan turun ( Atau Hilang Nafsu Makan Selama Berhari-hari )',
  'Mudah lelah ( Atau Sering Kecapekan Tanpa Aktivitas Fisik Yang Berarti )',
  'Berat badan turun ( Turun Drastis Selama Berhari-hari Bukan Karena Diet )',
];

export const informasiLainnyaQuestions = [
  'Anggota keluarga serumah ada yang sakit TBC ?',
  'Pernah berada satu ruangan dengan penderita TBC (di kantor, tempat kerja/ kelas/ kamar/ asrama/ panti/ barak, dll) ?',
  'Apakah pernah tinggal serumah minimal satu malam atau sering tinggal serumah pada siang hari dengan orang yang sakit TBC ?',
  'Pernah Berobat TBC tuntas',
  'Pernah berobat TBC tapi tidak tuntas',
  'Punya riwayat diabetes melitus/kencing manis',
  'Orang dengan HIV',
  'Ibu hamil',
  'Merokok',
  'Usia 0-14 Tahun',
  'Lansia (Diatas 60 Tahun)',
];

// Optional: gabungan semua pertanyaan, bisa digunakan untuk validasi atau submit ke backend
export const allQuestions = [...keluhanQuestions, ...informasiLainnyaQuestions];
