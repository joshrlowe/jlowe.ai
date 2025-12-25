import { useState, useEffect } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { useRouter } from "next/router";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const router = useRouter();
  const [toggled, setToggled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggle() {
    setToggled((t) => !t);
  }

  function handleClick() {
    setToggled((prev) => false);
  }

  // router.pathname is available during SSR in Next.js, so this is safe
  const pathname = router.pathname || "";

  return (
    <Navbar
      expand="lg"
      className={`py-0 ${styles.navBar}`}
      collapseOnSelect
      expanded={toggled}
    >
      <Container fluid className={`mx-0 px-0 ${styles.navContainer}`}>
        <Navbar.Brand href="/" aria-label="Josh Lowe Home">
          <img src="/images/logo.png" alt="Josh Lowe Logo" className={styles.logo} />
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          aria-expanded={toggled}
          aria-label="Toggle navigation menu"
          className={`${styles.toggler} ${toggled ? styles.toggled : ""}`}
          onClick={handleToggle}
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className={styles.navLinks} role="navigation" aria-label="Main navigation">
            <Link 
              href="/" 
              onClick={handleClick}
              suppressHydrationWarning
            >
              Home
            </Link>
            <Link 
              href="/about" 
              onClick={handleClick}
              suppressHydrationWarning
            >
              About
            </Link>
            <Link 
              href="/projects" 
              onClick={handleClick}
              suppressHydrationWarning
            >
              Projects
            </Link>
            <Link 
              href="/articles" 
              onClick={handleClick}
              suppressHydrationWarning
            >
              Articles
            </Link>
            <Link 
              href="/contact" 
              onClick={handleClick}
              suppressHydrationWarning
            >
              Contact
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
