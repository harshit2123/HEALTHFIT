import { Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { AdminDashboard } from './AdminDashboard'
import { MembersList } from './members/MembersList'
import { MemberDetail } from './members/MemberDetail'
import { CreateMember } from './members/CreateMember'
import { TrainersList } from './trainers/TrainersList'
import { CreateTrainer } from './trainers/CreateTrainer'
import { PlansList } from './subscriptions/PlansList'
import { CreatePlan } from './subscriptions/CreatePlan'
import { MemberSubscriptions } from './subscriptions/MemberSubscriptions'
import { NotificationsList } from './notifications/NotificationsList'
import { SendNotification } from './notifications/SendNotification'
import { ConversionsPage } from './ConversionsPage'

export function AdminPortal() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="members" element={<MembersList />} />
        <Route path="members/new" element={<CreateMember />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="trainers" element={<TrainersList />} />
        <Route path="trainers/new" element={<CreateTrainer />} />
        <Route path="subscriptions" element={<PlansList />} />
        <Route path="subscriptions/new" element={<CreatePlan />} />
        <Route path="member-subscriptions" element={<MemberSubscriptions />} />
        <Route path="notifications" element={<NotificationsList />} />
        <Route path="notifications/new" element={<SendNotification />} />
        <Route path="conversions" element={<ConversionsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}

function AdminLayout() {
  const { user, logout } = useAuthStore()
  const isOwner = user?.role === 'ORG_OWNER'

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    textDecoration: 'none',
    color: isActive ? '#6366f1' : '#374151',
    background: isActive ? '#eef2ff' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    display: 'block',
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ borderRight: '1px solid #e5e7eb', padding: '1.5rem 1rem', background: '#fafafa' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Spacefit</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <NavLink to="/admin" end style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/admin/members" style={linkStyle}>
            {isOwner ? 'Members' : 'My Members'}
          </NavLink>
          {isOwner && (
            <>
              <NavLink to="/admin/trainers" style={linkStyle}>Trainers</NavLink>
              <NavLink to="/admin/subscriptions" style={linkStyle}>Plans</NavLink>
              <NavLink to="/admin/member-subscriptions" style={linkStyle}>Subscriptions</NavLink>
              <NavLink to="/admin/notifications" style={linkStyle}>Notifications</NavLink>
              <NavLink to="/admin/conversions" style={linkStyle}>Conversions</NavLink>
            </>
          )}
          <div style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Coming soon</div>
          <span style={{ ...linkStyle({ isActive: false }), color: '#9ca3af' }}>Analytics</span>
        </nav>
        <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{user?.name}</p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#9ca3af' }}>{isOwner ? 'Gym Owner' : 'Trainer'}</p>
          <button onClick={logout} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>
      <main style={{ padding: '2rem', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
