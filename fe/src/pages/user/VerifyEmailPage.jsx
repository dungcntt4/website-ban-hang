import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'


function VerifyEmailPage() {
    const [params] = useSearchParams()
    const token = params.get('token')
    const [status, setStatus] = useState('loading') // loading | ok | error
    const [message, setMessage] = useState('Đang xác thực email…')


    useEffect(() => {
        (async () => {
            if (!token) { setStatus('error'); setMessage('Thiếu token xác thực'); return }
            try {
                const resp = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/verify-email`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
                })
                if (resp.ok) { setStatus('ok'); setMessage('Xác thực email thành công. Bạn có thể đăng nhập.') }
                else { const t = await resp.text(); setStatus('error'); setMessage(t || 'Xác thực thất bại') }
            } catch {
                setStatus('error'); setMessage('Có lỗi kết nối')
            }
        })()
    }, [token])


    return (
        <div className="center">
            <div className="card" style={{ textAlign: 'center' }}>
                {status === 'loading' && <div className="spinner" />}
                <h3>{message}</h3>
                <p><Link to="/">Về trang chủ để đăng nhập</Link></p>
            </div>
        </div>
    )
}
export default VerifyEmailPage;