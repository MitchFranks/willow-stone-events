import { UndoToast } from '@/components/staffing/UndoToast'
import { PhoneDrawer } from '@/components/staffing/StaffPhone'

// The planner's state lives in the root layout (app/layout.jsx) so Up Next and
// the dashboard can read it. Its own toast with Undo and the phone drawer that
// any planner screen can open are mounted here.
export default function Staffing2Layout({ children }) {
  return (
    <>
      {children}
      <PhoneDrawer />
      <UndoToast />
    </>
  )
}
