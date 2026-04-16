import { Link } from 'react-router-dom'
import { Card, CardBody } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'

export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="container-page py-10">
      <Card>
        <CardBody>
          <div className="text-lg font-semibold text-slate-900">
            Something went wrong
          </div>
          <p className="mt-2 text-sm text-slate-600">
            An unexpected error occurred. You can try again or go back to the
            landing page.
          </p>
          <pre className="mt-4 max-h-56 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
            {String(error?.message ?? error)}
          </pre>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={resetErrorBoundary}>Try again</Button>
            <Link to="/">
              <Button variant="outline">Go to landing</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

