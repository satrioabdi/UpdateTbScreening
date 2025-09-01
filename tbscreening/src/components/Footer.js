export default function Footer() {
  return (
    <footer className="bg-danger text-white px-4 py-3 mt-5">
      <div className="container">
        <div className="d-flex align-items-center mb-2">
          <img
            src="/assets/images/rekat.png"
            alt="Logo Rekat"
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          <strong className="fs-6">Yayasan Rekat Peduli Indonesia</strong>
        </div>
        <p className="mb-1 small">Jl. A. Yani 242–244, Gayungan, Surabaya</p>
        <p className="mb-1 small">WhatsApp: 0811xxxxxxx</p>
        <p className="mb-1 small">Instagram: @rekatindonesia</p>
        <p className="mb-1 small">Email: rekat@rekat.or.id</p>
        <p className="text-center small mt-3">© 2024 Rekat | Made With ❤️</p>
      </div>
    </footer>
  );
}
