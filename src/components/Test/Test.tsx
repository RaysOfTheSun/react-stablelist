import React from "react";

const Test = ({ content, key }: { content: string | number; key: string }) => {
  return <p key={key}>I successfully rendered and my content is {content}</p>;
};

export default Test;
