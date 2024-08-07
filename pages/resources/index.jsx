import React, { useEffect, useState } from "react";
import { marked } from "marked"; // Import the marked library
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Resources</h1>
      {resources.map((resource, index) => (
        <Link href={`/resources/${resource}`}>
          <p key={index}>{resource}</p>
        </Link>
      ))}
    </div>
  );
};

export default ResourcePage;
