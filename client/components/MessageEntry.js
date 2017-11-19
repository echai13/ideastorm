import React, { Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../store/messageEntry'
import { fetchRoom } from '../store/whiteboard'
import { withRouter } from 'react-router-dom';

export class MessageEntry extends Component {
  constructor(props) {
    super(props)
    this.state = {
      content: ''
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidMount() {
    const { id } = this.props.match.params
    this.props.getWhiteboard(id)
  }

  handleSubmit(message, evt) {
    evt.preventDefault()
    const whiteboardId = this.props.whiteboard.id
    const {text} = message
    this.props.sendMessage({text, whiteboardId})
    this.setState({content: evt.target.value})
    document.getElementById('new-message-form').value = {}
  }

  handleChange(evt){
    this.props.messageEntry.singleMessage[evt.target.name] = evt.target.value
    this.setState({content: evt.target.value})
  }

  render() {
    const { handleSubmit, whiteboard, messageEntry } = this.props
    const {singleMessage} = messageEntry
    return (
      <form id="new-message-form" onSubmit={evt => this.handleSubmit(singleMessage, evt)}>
        <div className="input-group input-group-lg">
          <input
            className="form-control"
            type="text"
            name="text"
            value={singleMessage.text}
            onChange={this.handleChange}
            placeholder="Say something nice..."
          />
          <span className="input-group-btn">
            <button className="btn btn-default" type="submit">Chat!</button>
          </span>
        </div>
      </form>
    )
  }
}

const mapState = (state) => {
  return {
    whiteboard: state.whiteboard,
    messageEntry: state.messageEntry,
  }
}

const mapDispatch = (dispatch) => {
  return {
    getWhiteboard: (id) => {
      dispatch(fetchRoom(id))
    },
    sendMessage: (message) => {
      dispatch(addMessage(message))
    }
  }
}

export default withRouter(connect(mapState, mapDispatch)(MessageEntry))
