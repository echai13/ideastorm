/* eslint-disable no-lone-blocks */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { editNote, fetchNotes, deleteNote, castVote, fetchRoom, insertBranch, fetchBranches } from '../store'
import { withRouter } from 'react-router'
import { TwitterPicker } from 'react-color'
import ContentEditable from 'react-contenteditable'
import debounce from 'lodash/debounce'
import * as d3 from 'd3'

class Whiteboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dragging: false,
      rel: null,
      pos: { x: null, y: null },
      selectedNote: 0,
      show: false,
      connectionArray: [],
      content: {},
      branches: []
    }
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.changed = debounce(this.props.editNote, 250)
    this.handleColorChange = this.handleColorChange.bind(this)
    this.clickConnection = this.clickConnection.bind(this)
    this.handleVote = this.handleVote.bind(this)
    // this.showBranches = this.showBranches.bind(this)
  }


  componentDidMount() {
    const boardId = this.props.match.params.id
    this.props.fetchRoom(boardId)
    this.props.fetchNotes(boardId)

    this.props.fetchBranches(boardId)
    console.log(this.props.branches)
  }

  componentDidUpdate(props, state) {
    if (this.state.dragging && !state.dragging) {
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('mouseup', this.onMouseUp)
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
    }
  }

  //when user clicks mouse down, dragging state is set to true and new relative position
  //is calculated, the position is set to null
  onMouseDown(evt) {
    if (evt.button !== 0) return

    var pos = evt.target.getBoundingClientRect()
    this.setState({
      dragging: true,
      rel: {
        x: evt.pageX - pos.left,
        y: evt.pageY - pos.top
      },
      pos: {
        x: null,
        y: null
      }
    })
    evt.stopPropagation()
    evt.preventDefault()
  }

  //once mouse is released, the new position of note is updated in db
  //and dragging is set to false
  onMouseUp(evt) {
    if (this.state.pos.x !== null && this.state.pos.y !== null) this.props.editNote(this.state.selectedNote, { position: [this.state.pos.x, this.state.pos.y] })
    evt.stopPropagation()
    evt.preventDefault()
    this.setState({ dragging: false })
  }


  //when state.pos is set to anything but null, the top and left of card is set to state.pos instead of note.position[0] & note.position[1]
  onMouseMove(evt) {
    // console.log(evt)
    if (!this.state.dragging) return
    this.setState({
      pos: {
        x: evt.pageX - this.state.rel.x,
        y: evt.pageY - this.state.rel.y
      }
    })

    this.props.editNote(this.state.selectedNote, { position: [this.state.pos.x, this.state.pos.y] })

    evt.stopPropagation()
    evt.preventDefault()
  }

  handleDelete(evt) {
    evt.preventDefault();
    this.props.deleteNote(evt.target.value, this.props.boardId);
  }

  handleVote(evt) {
    evt.preventDefault();
    evt.target.disabled = true;
    this.props.castVote(evt.target.value);
  }

  handleChange(evt) {
    evt.preventDefault()
    let content = { ...this.state.content }
    content[this.state.selectedNote] = evt.target.value
    this.setState({ content })
    if (evt.target.value !== '') this.changed(this.state.selectedNote, { text: evt.target.value })
    // this.setState({ content: '' })
  }

  handleConnect(evt, noteId) {
    // let newSelectedNote = {}
    // newSelectedNote[noteId] = evt.target.getBoundingClientRect()
    this.setState({ connectionArray: [...this.state.connectionArray, { noteId, elem: evt.target.getBoundingClientRect()} ] }, function() {
      console.log(this.state.connectionArray)
      if (this.state.connectionArray.length >= 2) {
        console.log(this.state.connectionArray)
        let firstConnect = this.state.connectionArray[0].elem
        let secondConnect = this.state.connectionArray[1].elem
        let bodyRect = document.body.getBoundingClientRect()
        console.log(bodyRect)
        console.log(firstConnect)
        console.log(secondConnect)
        d3.select('#svg').append('line')
          .attr("x1", firstConnect.x)
          .attr("y1", firstConnect.y)
          .attr("x2", secondConnect.x)
          .attr("y2", secondConnect.y)
          .attr("stroke-width", 2)
          .attr("stroke", "black")
        this.props.insertBranch({noteId: this.state.connectionArray[0].noteId, endNoteId: this.state.connectionArray[1].noteId, whiteboardId: this.props.boardId})
        let newArr = this.state.connectionArray.slice(2)
        this.setState({ connectionArray: newArr })
      }
    })
  }

  // showBranches() {
  //   this.props.branches && this.props.bran
  // }

  handleColorChange = (color) => {
    if (this.state.connectionArray.length) {
      this.state.connectionArray.forEach(note => {
        document.getElementById(`card${note}`).style.background = color.hex
        this.props.editNote(note, { color: color.hex })
        let selectedCard = document.getElementById(`card${note}`)
        selectedCard.style.boxShadow = '0 4px 2px -2px gray'
      })
    }
    this.setState({ connectionArray: [] })
  }

  clickConnection = (evt, note) => {
    if (this.state.connectionArray.indexOf(note.id) === -1 && note.id !== 0) {
      this.setState({ connectionArray: [...this.state.connectionArray, note.id] })
      let selectedCard = document.getElementById(`card${note.id}`)
      selectedCard.style.boxShadow = '0 0 20px yellow'
    } else if (note.id !== 0) {
      let array = this.state.connectionArray
      let index = array.indexOf(note.id)
      array.splice(index, 1)
      this.setState({ connectionArray: array })
      let selectedCard = document.getElementById(`card${note.id}`)
      selectedCard.style.boxShadow = '0 4px 2px -2px gray'
    }
  }

  render() {
    const { userId, hostId } = this.props
    let data = [];
    if (this.props.notes) {
      data = this.props.notes
    }
    return (
      <div>


      <div id="whiteboard">
       <svg id="basket" width="300" height="250">
      <g>
        <rect
           width="300" height="250"
        style = {{fill: 'white', stroke: 'black', strokeWidth: 5, opacity: 0.5}} />
        <text x="4" y="50" fontFamily="Verdana" fontSize="35" fill="blue">Idea Basket</text>
      </g>
      </svg>
      <svg id="svg" width={document.body.getBoundingClientRect().width} height={document.body.getBoundingClientRect().height}>
      </svg>

      {
        data && data.map((note) => {
          {
            return note.position &&
             (
                  <div
                    className="card"
                    id={`card${note.id}`}
                    key={note.id}
                    style = {{position: 'absolute', background: note.color,
                    left: this.state.selectedNote === note.id && this.state.pos.x || note.position[0],
                    top: this.state.selectedNote === note.id && this.state.pos.y || note.position[1],
                    cursor: 'pointer' }}
                >

                    {/* style = {{position: 'absolute', left: this.state.selectedNote === note.id && this.state.pos.x || note.position[0], top: this.state.selectedNote === note.id && this.state.pos.y || note.position[1], cursor: 'pointer' }}
                    onMouseMove={this.onMouseMove}
                    onMouseUp={this.onMouseUp}
                    onMouseDown={(evt) => {this.setState({ selectedNote: note.id }); this.onMouseDown(evt)}} > */}


                  {this.props.open &&
                  <span>
                    <button style={{float: 'left'}} value={note.id} onClick={this.handleDelete}>x</button>
                    <button
                        onMouseMove={this.onMouseMove}
                        onMouseUp={this.onMouseUp}
                        onMouseDown={(evt) => {this.setState({ selectedNote: note.id }); this.onMouseDown(evt)}}
                        style={{borderRadius: '25px'}}
                    > Drag

                    </button>

                          <button value={note.id} onClick={(evt) => { this.clickConnection(evt, note) }}>edit</button>
                          {this.props.vote &&
                            <div style={{ float: 'right' }} >
                              <button value={note.id} onClick={this.handleVote}>⚡️</button>
                              {
                                note.votes > 0 && <a>{note.votes}</a>
                              }
                            </div>
                          }
                          <button
                            id={`connect-${note.id}`}
                            ref={`connect-${note.id}`}
                            style={{borderRadius: '25px', width: '25px', height: '25px', backgroundColor: 'pink'}}
                            onClick={evt => { evt.preventDefault(); this.handleConnect(evt, note.id)}}
                          />
                        </span>
                      }
                      {note.text &&
                        <ContentEditable
                          onClick={() => { this.setState({ selectedNote: note.id, pos: { x: null, y: null } }); console.log(this.state.selectedNote) }}
                          className="card-content"
                          html={this.state.content[note.id] || note.text}
                          disabled={userId !== note.userId && userId !== hostId}
                          onChange={this.handleChange}
                          contentEditable="plaintext-only"
                        />
                      }

                      {note.image &&
                        <div className="card-image">
                          <img onClick={this.clickImage} src={note.image} />
                        </div>
                      }


                      {note.link &&
                        <div className="card-action">
                          <a type="text/css" href={note.link}>Go Here </a>
                        </div>
                      }

                    </div>

                  )
              }

            })
          }
          <div className="colorPalette">
            <button onClick={() => this.setState({ show: !this.state.show })}>
              <img src="/icons8-fill-color-30.png" align="center" alt="Branch" />
            </button>
            {
              this.state.show ?
                <TwitterPicker onChange={this.handleColorChange} />
                : null
            }
          </div>
          {/* <button
            onClick={this.showBranches}
            >Show Branches
          </button> */}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  notes: state.notes,
  boardId: state.singleWhiteboard.id,
  hostId: state.singleWhiteboard.userId,
  userId: state.user.id,
  open: !state.singleWhiteboard.closed,
  vote: state.singleWhiteboard.voteable,
  branches: state.branches
})

const mapDispatchToProps = { editNote, fetchNotes, deleteNote, castVote, fetchRoom, insertBranch, fetchBranches  }

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Whiteboard));
