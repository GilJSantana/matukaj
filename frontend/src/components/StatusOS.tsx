import { STATUS_OS, type StatusOS as Status } from '../services/os'

export function StatusOS({ status }: { status: Status }) {
  const { rotulo, cor } = STATUS_OS[status]
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${cor}`}>{rotulo}</span>
}
