import Image from "next/image"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-24 h-24 overflow-hidden">
        <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={96} height={96} className="object-contain" />
      </div>
      <h1 className="text-2xl font-bold mt-2">Al-Mahir Academy</h1>
    </div>
  )
}
