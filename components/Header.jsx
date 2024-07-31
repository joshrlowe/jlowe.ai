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

  return (
    <Navbar expand="lg" className={`py-0 ${styles.navBar}`} collapseOnSelect>
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
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/contact">Contact</Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
