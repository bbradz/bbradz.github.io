import React, { useEffect } from "react";

const TwitterEmbed = () => {
  useEffect(() => {
    // Ensure Twitter's widgets.js is loaded and re-applied
    const loadTwitterScript = () => {
      if (window.twttr) {
        window.twttr.widgets.load();
      } else {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.charset = "utf-8";
        document.body.appendChild(script);
      }
    };

    loadTwitterScript();
  }, []);

  return (
    <div className="centered-item-holder">
      <blockquote className="twitter-tweet">
        <p lang="en" dir="ltr">
          So Shampoo has been getting some renewed attention for winning one of
          the inaugural AlgoPerf challenges. I wanted to understand what the
          method is doing, so I employed my favourite trick of just ~directly
          interpreting the pseudocode~
          <br />
          <br />
          (1/8)
          <a href="https://t.co/0VlJRQ9rt6">pic.twitter.com/0VlJRQ9rt6</a>
        </p>
        — Jeremy Bernstein (@jxbz)
        <a href="https://twitter.com/jxbz/status/1819846348130418706?ref_src=twsrc%5Etfw">
          August 3, 2024
        </a>
      </blockquote>
    </div>
  );
};

export default TwitterEmbed;
