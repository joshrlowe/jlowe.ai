import { useEffect, useState, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import styles from "@/styles/Welcome.module.css";
import WelcomeCTAs from "./WelcomeCTAs";
import ScrollIndicator from "./ScrollIndicator";
import "gsap/ScrollTrigger";

// Dynamically import ReactTyped to reduce initial bundle size
const ReactTyped = dynamic(() => import("react-typed").then((mod) => mod.ReactTyped), {
  ssr: false,
  loading: () => <span>Hi, my name is...</span>,
});

const Welcome = ({ data, contactData }) => {
  const [showName, setShowName] = useState(false);
  const [showCallToAction, setShowCallToAction] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  
  const nameRef = useRef(null);
  const ctaRef = useRef(null);
  const bioRef = useRef(null);
  const containerRef = useRef(null);

  // GSAP animation for name with hover effect
  useEffect(() => {
    if (showName && nameRef.current) {
      gsap.fromTo(
        nameRef.current,
        {
          opacity: 0,
          scale: 0.8,
          y: 30
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "back.out(1.7)"
        }
      );

      // Add hover effect
      const nameElement = nameRef.current;
      const handleMouseEnter = () => {
        gsap.to(nameElement, {
          scale: 1.05,
          textShadow: "0 0 20px rgba(187, 19, 19, 0.5)",
          duration: 0.3,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(nameElement, {
          scale: 1,
          textShadow: "0 0 0px rgba(187, 19, 19, 0)",
          duration: 0.3,
          ease: "power2.out"
        });
      };

      nameElement.addEventListener("mouseenter", handleMouseEnter);
      nameElement.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        nameElement.removeEventListener("mouseenter", handleMouseEnter);
        nameElement.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [showName]);

  useEffect(() => {
    if (showCallToAction && ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        {
          opacity: 0,
          x: -50
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out"
        }
      );
    }
  }, [showCallToAction]);

  useEffect(() => {
    if (showBio && bioRef.current) {
      gsap.fromTo(
        bioRef.current,
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out"
        }
      );
    }
  }, [showBio]);

  useEffect(() => {
    if (showCTAs) {
      setShowCTAs(true);
    }
  }, [showBio]);

  if (!data) {
    return null;
  }

  return (
    <Container
      ref={containerRef}
      fluid
      className={`d-flex justify-content-center ${styles.centeredLower} ${styles.darkBackground}`}
      style={{ minHeight: "100vh", position: "relative" }}
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
                  setTimeout(() => setShowName(true), 500);
                  setTimeout(() => setShowCallToAction(true), 1250);
                  setTimeout(() => setShowBio(true), 2000);
                  setTimeout(() => setShowCTAs(true), 2800);
                }}
              />
            )}
            {!showCursor && "Hi, my name is..."}
          </p>
          {showName ? (
            <h1 ref={nameRef} className={styles.name}>{data.name}</h1>
          ) : (
            <div></div>
          )}
          {showCallToAction ? (
            <h3 ref={ctaRef} className={styles.callToAction}>
              {data.callToAction}
            </h3>
          ) : (
            <div></div>
          )}
          {showBio ? (
            <p ref={bioRef} className={styles.bio}>{data.briefBio}</p>
          ) : (
            <div></div>
          )}
          {showCTAs && <WelcomeCTAs />}
        </Col>
      </Row>
      <ScrollIndicator targetId="featured-projects" />
    </Container>
  );
};

export default Welcome;

