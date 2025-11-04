import { Link } from 'react-router-dom'
function CheckEmailPage() {
    return (
        <div className="center">
            <div className="card" style={{ textAlign: 'center' }}>
                <div className="spinner" />
                <h3>Vui lòng kiểm tra email để xác thực / đặt lại mật khẩu</h3>
                <p><Link to="/">Về trang chủ</Link></p>
            </div>
        </div>
    )
}
export default CheckEmailPage;