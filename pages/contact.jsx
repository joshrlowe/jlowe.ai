import React, { useEffect, useState } from "react";
import { ReactTyped } from "react-typed";
import { Container, Spinner } from "react-bootstrap";

import styles from "@/styles/ContactPage.module.css";

const ContactPage = () => {
  const [contactData, setContactData] = useState(null);
  const [showCursor, setShowCursor] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contact");
        const data = await response.json();
        setContactData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!contactData) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="my-5">
      <h1 className={styles.pageTitle}>
        {showCursor && (
          <ReactTyped
            strings={["Connect With Me"]}
            typeSpeed={25}
            onComplete={() => {
              setTimeout(() => setShowCursor(false), 1500);
              setTimeout(() => setShowContent(true), 250);
            }}
          />
        )}
        {!showCursor && "Connect With Me"}
      </h1>
      {showContent && (
        <>
          <div class={`${styles.contactCard}  ${styles.fadeIn}`}>
            <div class={styles.contactItem}>
              <h2>Name</h2>
              <p>Josh Lowe</p>
            </div>
            <div class={styles.contactItem}>
              <h2>Email</h2>
              <p>
                <a href="mailto:joshlowe.cs@gmail.com">joshlowe.cs@gmail.com</a>
              </p>
            </div>
            <div class={styles.contactItem}>
              <h2>Phone</h2>
              <p>
                <a href="tel:+12676448659">+1 (267) 644-8659</a>
              </p>
            </div>
            <div class={styles.contactItem}>
              <h2>Location</h2>
              <p>Hatfield, PA, US</p>
            </div>
            <div class={styles.contactItem}>
              <h2>Availability</h2>
              <p>{contactData.availability.workingHours}</p>
              <p>
                <em>Best reached via phone or LinkedIn message.</em>
              </p>
            </div>
          </div>
        </>
      )}
    </Container>
  );
};

export default ContactPage;
