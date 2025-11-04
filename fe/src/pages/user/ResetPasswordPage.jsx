import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'


function ResetPasswordPage() {
    const [params] = useSearchParams()
    const token = params.get('token')


    const [pw, setPw] = useState('')
    const [show, setShow] = useState(false)
    const [msg, setMsg] = useState('')
    const [status, setStatus] = useState('idle') // idle | loading | done | error


    async function handleReset() {
        if (!pw) { setMsg('Vui lòng nhập mật khẩu mới'); return }
        setStatus('loading')
        try {
            const resp = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/reset-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: pw })
            })
            if (resp.ok) { setStatus('done'); setMsg('Đặt lại mật khẩu thành công. Hãy đăng nhập.') }
            else { setStatus('error'); setMsg('Đặt lại mật khẩu thất bại') }
        } catch {
            setStatus('error'); setMsg('Có lỗi kết nối')
        }
    }


    useEffect(() => { if (!token) { setStatus('error'); setMsg('Thiếu token') } }, [token])


    return (
        <div className="center">
            <div className="card">
                <h3>Đặt lại mật khẩu</h3>
                {status === 'loading' && <div className="spinner" />}
                <input type={show ? 'text' : 'password'} placeholder="Mật khẩu mới" value={pw} onChange={e => setPw(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 10 }} />
                <button onClick={() => setShow(s => !s)} style={{ marginTop: 8 }}>{show ? <FaEyeSlash /> : <FaEye />}</button>
                <button onClick={handleReset} style={{ width: '100%', padding: 10, marginTop: 12 }}>Xác nhận</button>
                {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
                <p><Link to="/">Về trang chủ</Link></p>
            </div>
        </div>
    )
}
export default ResetPasswordPage;