import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { marked } from "marked";

const ResourcesByTopic = () => {
  const [resources, setResources] = useState(null);
  const router = useRouter();
  const { topic } = router.query;

  useEffect(() => {
    if (topic) {
      const fetchData = async () => {
        try {
          const response = await fetch(`/api/resources/${topic}`);
          const resourceData = await response.json();
          setResources(resourceData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [topic]);

  if (!resources) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Resources for {topic}</h1>
      {resources.map((resource) => (
        <div key={resource._id}>
          <Link href={`/resources/${topic}/${resource.slug}`}>
            <h2>{resource.title}</h2>
          </Link>
          <p>{resource.description}</p>
          <p>Author: {resource.author}</p>
          <p>Tags: {resource.tags.join(", ")}</p>
        </div>
      ))}
    </div>
  );
};

export default ResourcesByTopic;
