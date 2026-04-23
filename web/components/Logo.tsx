import Image from "next/image"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-bold ${className}`}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <Image 
          src="/logo.png" 
          alt="InMail Logo" 
          fill 
          className="object-cover"
        />
      </div>
      <span className="text-xl tracking-tight">InMail</span>
    </div>
  )
}
