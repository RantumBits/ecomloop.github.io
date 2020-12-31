import React from 'react'
import './Footer.css'

export default () => (
  <div>
  <script>
    $('head').append("<script>function loadScript(a){var b=document.getElementsByTagName("head")[0],c=document.createElement("script");c.type="text/javascript",c.src="https://tracker.metricool.com/resources/be.js",c.onreadystatechange=a,c.onload=a,b.appendChild(c)}loadScript(function(){beTracker.t({hash:"277e70a8f2b51b7a14830ff3c44fa70f"})});</script>");
</script>

    <footer className="footer">
      <div className="container taCenter">
        <span>
          <a href="/about/">about</a> <a href="/contact/">contact</a> <br/><a href="https://twitter.com/ecomloop" target="_blank"  rel="noopener noreferrer">twitter</a> <a href="https://github.com/ecomloop" target="_blank"  rel="noopener noreferrer">github</a> <a href="https://www.upwork.com/agencies/~018dcd9aca877342a3" target="_blank" rel="noopener noreferrer">upwork</a> <a  rel="noopener noreferrer" target="_blank" href="https://www.linkedin.com/company/ecomloop/">linkedin</a>
          <br/>© Copyright {new Date().getFullYear()} All rights reserved.
        </span>
      </div>
    </footer>
  </div>
)
