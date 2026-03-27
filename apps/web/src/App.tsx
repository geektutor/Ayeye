import { createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { CheckInPage } from './pages/checkin/CheckInPage'
import { CreateEventPage } from './pages/dashboard/CreateEventPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { EditEventPage } from './pages/dashboard/EditEventPage'
import { EventDetailPage } from './pages/dashboard/EventDetailPage'
import { EventRegistrationPage } from './pages/events/EventRegistrationPage'
import { PaymentCallbackPage } from './pages/payment/PaymentCallbackPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { HomePage } from './pages/HomePage'
import { RegisterOrganizerPage } from './pages/auth/RegisterOrganizerPage'

function NotFoundPage() {
  return (
    <div className="page">
      <main className="container container--narrow" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h1>404</h1>
        <p>Page not found.</p>
      </main>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/discover', element: <DiscoverPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterOrganizerPage /> },

  // Protected organizer routes
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/dashboard/events/new',
    element: <ProtectedRoute><CreateEventPage /></ProtectedRoute>,
  },
  {
    path: '/dashboard/events/:id',
    element: <ProtectedRoute><EventDetailPage /></ProtectedRoute>,
  },
  {
    path: '/dashboard/events/:id/edit',
    element: <ProtectedRoute><EditEventPage /></ProtectedRoute>,
  },
  {
    path: '/checkin',
    element: <ProtectedRoute><CheckInPage /></ProtectedRoute>,
  },

  // Public attendee routes
  { path: '/events/:registrationLink/register', element: <EventRegistrationPage /> },
  { path: '/payment/callback', element: <PaymentCallbackPage /> },

  { path: '*', element: <NotFoundPage /> },
])
