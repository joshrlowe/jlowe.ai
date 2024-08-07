import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { marked } from "marked";

const ResourceBySlug = () => {
  const [resource, setResource] = useState(null);
  const router = useRouter();
  const { topic, slug } = router.query;

  useEffect(() => {
    if (!slug || !topic) return; // If slug or topic is not yet available, do nothing.

    console.log(slug);
    console.log(topic);

    const fetchResource = async () => {
      try {
        const response = await fetch(`/api/resources/${topic}/${slug}`);
        console.log(response);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const resourceData = await response.json();
        setResource(resourceData);
      } catch (error) {
        console.error("Error fetching resource:", error);
      }
    };

    fetchResource();
  }, [slug, topic]);

  if (!resource) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{resource.title}</h1>
      <p>
        <strong>Description:</strong> {resource.description}
      </p>
      <p>
        <strong>Content Type:</strong> {resource.contentType}
      </p>
      {resource.contentType === "Article" && resource.content && (
        <div>
          <h3>Content:</h3>
          <div dangerouslySetInnerHTML={{ __html: marked(resource.content) }} />
        </div>
      )}
      {resource.contentType === "Video" && resource.url && (
        <div>
          <h3>Video:</h3>
          <a href={resource.url}>{resource.url}</a>
        </div>
      )}
      <p>
        <strong>Tags:</strong> {resource.tags.join(", ")}
      </p>
      <p>
        <strong>Date Published:</strong>{" "}
        {new Date(resource.datePublished).toLocaleDateString()}
      </p>
      <p>
        <strong>Author:</strong> {resource.author}
      </p>
    </div>
  );
};

export default ResourceBySlug;
