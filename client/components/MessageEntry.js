import React, { Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../store/messageEntry'
import { fetchRoom } from '../store/whiteboard'
import { withRouter } from 'react-router';

export class MessageEntry extends Component {
  constructor(props) {
    super(props)
    this.state = {
      text: ''
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidMount() {
    const { id } = this.props.match.params
    this.props.getWhiteboard(id)
  }

  handleSubmit = (evt) => {
    evt.preventDefault()
    const whiteboardId = this.props.whiteboard.id
    const {text} = this.state
    this.props.sendMessage({text, whiteboardId})
    this.setState({text: ''})
  }

  handleChange(evt){
    this.setState({text: evt.target.value})
  }

  render() {
    const { text } = this.state
    const { messageEntry } = this.props
    return (
      <form id="new-message-form" onSubmit={this.handleSubmit}>
        <div className="input-group input-group-lg">
          <input
            className="form-control"
            type="text"
            name="text"
            value={text}
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
