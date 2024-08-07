import { useCallback, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { ReactTyped } from "react-typed";
import styles from "@/styles/Welcome.module.css";

const Welcome = () => {
  const [data, setData] = useState(null);
  const [showName, setShowName] = useState(false);
  const [showCallToAction, setShowCallToAction] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/welcome");
      const welcomeData = await response.json();
      setData(welcomeData);
      setTimeout(() => setShowName(true), 500);
      setTimeout(() => setShowCallToAction(true), 1250);
      setTimeout(() => setShowBio(true), 2000);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  });

  return (
    <Container
      fluid
      className={`d-flex justify-content-center vh-100 ${styles.centeredLower} ${styles.darkBackground}`}
    >
      <Row className={`${styles.fixedWidth} ${styles.lowerContent}`}>
        <Col>
          <p className={styles.introText}>
            {showCursor && (
              <ReactTyped
                strings={["Hi, my name is..."]}
                typeSpeed={100}
                onComplete={() => {
                  setTimeout(() => setShowCursor(false), 1500);
                  fetchData();
                }}
              />
            )}
            {!showCursor && "Hi, my name is..."}
          </p>
          {showName ? (
            <h1 className={`${styles.name} ${styles.fadeIn}`}>{data.name}</h1>
          ) : (
            <div></div>
          )}
          {showCallToAction ? (
            <h3 className={`${styles.callToAction} ${styles.fadeIn}`}>
              {data.callToAction}
            </h3>
          ) : (
            <div></div>
          )}
          {showBio ? (
            <p className={`${styles.bio} ${styles.fadeIn}`}>{data.briefBio}</p>
          ) : (
            <div></div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Welcome;
