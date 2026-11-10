import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <p>Nová Remexo appka – kostra běží.</p> },
    ],
  },
])
