import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navBar">
      <Link href="/">
        <Image
          src="/images/logo.png"
          alt="logo"
          width={48}
          height={48}
          className="logo"
        />
      </Link>

      <ul className="navLinks">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <Link href="/projects">Projects</Link>
        </li>
        <li>
          <Link href="/resources">Resources</Link>
        </li>
        <li>
          <Link href="/contact">Contact</Link>
        </li>
      </ul>
    </nav>
  );
}
