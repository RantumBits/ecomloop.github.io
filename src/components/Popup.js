import React, { Component, Fragment } from 'react'
import { X } from 'react-feather'

import './Popup.css'

class Popup extends Component {
  constructor(props) {
    super(props)
    this.state = { showPopup: false }
  }

  togglePopup() {
    this.setState({
      showPopup: !this.state.showPopup
    })
  }

  render() {
    const { children } = this.props
    return (
      <Fragment>
        <div className="taCenter">
          <div class="Button" onClick={this.togglePopup.bind(this)}>
            start &#123;next&#125; project
          </div>
        </div>

        {this.state.showPopup ? (
          <div className="Popup-Overlay">
            <div
              className="Popup-Background"
              onClick={this.togglePopup.bind(this)}
            ></div>
            <div className="Popup-Inner">
              <X class="Popup-Close" onClick={this.togglePopup.bind(this)} />
              <div class="klaviyo-form-SPsAZ9">uh oh..too late now! (just kidding...try a refresh)</div>
            </div>
          </div>
        ) : null}
      </Fragment>
    )
  }
}
export default Popup
