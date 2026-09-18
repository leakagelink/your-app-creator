import logo from "@/assets/logo-badre.png";

export function Logo({
  className = "size-11",
  alt = "Badre Electrician Service",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={logo}
      alt={alt}
      width={1024}
      height={1024}
      className={`${className} rounded-2xl object-contain shadow-sm`}
    />
  );
}
