import { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const [toggled, setToggled] = useState(false);

  function handleToggle() {
    setToggled((t) => !t);
  }

  function handleClick() {
    setToggled((prev) => false);
  }

  return (
    <Navbar
      expand="lg"
      className={`py-0 ${styles.navBar}`}
      collapseOnSelect
      expanded={toggled}
    >
      <Container fluid className={`mx-0 px-0 ${styles.navContainer}`}>
        <Navbar.Brand href="/">
          <img src="/images/logo.png" alt="logo" className={styles.logo} />
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className={`${styles.toggler} ${toggled ? styles.toggled : ""}`}
          onClick={handleToggle}
        />
        <Navbar.Collapse>
          <Nav className={styles.navLinks}>
            <Link href="/" onClick={handleClick}>
              Home
            </Link>
            <Link href="/about" onClick={handleClick}>
              About
            </Link>
            <Link href="/projects" onClick={handleClick}>
              Projects
            </Link>
            <Link href="/resources" onClick={handleClick}>
              Resources
            </Link>
            <Link href="/contact" onClick={handleClick}>
              Contact
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
