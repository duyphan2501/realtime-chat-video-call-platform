import { Loader } from "lucide-react"
const IconLoading = ({size}: {size?: number}) => {
  return (
    <div>
      <Loader className="animate-spin" size={size} />
    </div>
  )
}

export default IconLoading