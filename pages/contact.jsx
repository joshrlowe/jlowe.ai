import React, { useEffect, useState } from "react";

const ContactPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contact");
        const contactData = await response.json();
        setData(contactData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Contact Information</h1>
      <img src={data.professionalPhoto} alt="Professional" />
      <p>Name: {data.name}</p>
      <p>
        Email: <a href={`mailto:${data.emailAddress}`}>{data.emailAddress}</a>
      </p>
      <p>
        Phone: <a href={`tel:${data.phoneNumber}`}>{data.phoneNumber}</a>
      </p>

      <div>
        <h2>Location</h2>
        <p>
          {data.location.city}, {data.location.region}
        </p>
        <iframe
          src={data.location.mapEmbedLink}
          width="600"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          title="location-map"
        ></iframe>
      </div>

      <div>
        <h2>Availability</h2>
        <p>Working Hours: {data.availability.workingHours}</p>
        <p>
          Preferred Contact Times: {data.availability.preferredContactTimes}
        </p>
        <p>{data.availability.additionalInstructions}</p>
      </div>

      <div>
        <h2>Additional Contact Methods</h2>
        {data.additionalContactMethods.map((method, index) => (
          <div key={index}>
            <p>
              {method.method}: {method.handle}
            </p>
          </div>
        ))}
      </div>

      <p>{data.callToAction}</p>
    </div>
  );
};

export default ContactPage;
