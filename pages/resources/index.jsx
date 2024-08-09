import React, { useEffect, useState } from "react";
import { marked } from "marked"; // Import the marked library
import { Container, Spinner } from "react-bootstrap";
import Link from "next/link";

const ResourcePage = () => {
  const [resources, setResources] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/resources");
        const resourceData = await response.json();
        setResources(resourceData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!resources) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="my-5">
      <h1>Resources</h1>
      <p>Welcome to the Resources Page</p>
      {/* {resources.map((resource, index) => (
        <Link href={`/resources/${resource}`}>
          <p key={index}>{resource}</p>
        </Link>
      ))} */}
    </Container>
  );
};

export default ResourcePage;
