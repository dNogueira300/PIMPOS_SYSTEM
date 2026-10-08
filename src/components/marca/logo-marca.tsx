type LogoMarcaProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
};

/** Derivados del original aprobado; una marca administrada conserva su propia URL. */
export function LogoMarca({ src, alt, className, sizes = "160px" }: LogoMarcaProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- WebP ya optimizado con variantes; también respeta URLs externas administradas.
    <img
      src={src}
      srcSet={
        src === "/marca/logo.webp"
          ? "/marca/logo-256.webp 256w, /marca/logo-512.webp 512w, /marca/logo.webp 768w"
          : undefined
      }
      sizes={sizes}
      alt={alt}
      width={768}
      height={512}
      className={className}
    />
  );
}
