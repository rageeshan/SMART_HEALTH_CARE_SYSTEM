import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card, CardBody } from '../components/ui/Card.jsx'

export function NotFoundPage() {
  return (
    <div className="container-page py-10">
      <Card>
        <CardBody>
          <div className="text-2xl font-semibold text-slate-900">404</div>
          <div className="mt-1 text-sm text-slate-600">
            The page you’re looking for doesn’t exist.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/">
              <Button>Back to landing</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

