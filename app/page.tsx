import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Image
        src="/angel-wings.png"
        alt=""
        width={991}
        height={279}
        className="floating-decal w-56 sm:w-72"
        priority
      />
      <h1 className="landing-title text-5xl">♱ Ready to be styled? ♱</h1>
      <Link href="/home" className="btn-pill mt-4">
        † Start †
      </Link>
    </div>
  );
}
