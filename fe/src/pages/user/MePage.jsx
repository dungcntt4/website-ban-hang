import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'


 function MePage() {
    const [me, setMe] = useState(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        (async () => {
            const resp = await apiFetch('/api/auth/me')
            if (resp.ok) { setMe(await resp.json()) }
            setLoading(false)
        })()
    }, [])


    if (loading) return <div className="center"><div className="card"><div className="spinner" />Đang tải…</div></div>


    return (
        <div className="center">
            <div className="card">
                <h3>Thông tin tài khoản</h3>
                {!me ? (
                    <p>Không lấy được thông tin người dùng.</p>
                ) : (
                    <ul>
                        <li><b>ID:</b> {me.id}</li>
                        <li><b>Email:</b> {me.email}</li>
                        <li><b>Role:</b> {me.role || 'N/A'}</li>
                        <li><b>Verified:</b> {String(me.emailVerified)}</li>
                    </ul>
                )}
            </div>
        </div>
    )
}
export default MePage;