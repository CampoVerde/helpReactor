import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import TicketList from './components/ticketList.jsx';
import TicketSubmission from './components/ticketSubmission.jsx';
import Login from './components/login.jsx';
import Nav from './components/nav.jsx';
import AddUser from './components/addUser.jsx';
import AdminDashboard from './components/adminDashboard.jsx';
import AdminFilter from './components/adminFilter.jsx';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      ticketList: [],
      ticketCategoryList: ['React', 'Socket.IO', 'Recursion', 'Postgres'],
      user: null,
      waitTime: '1mins'
    };
  }

  componentWillMount() {
    $.ajax({
      url: '/api/users/:id',
      type: 'GET',
      async: false,
      success: (response) => {
        return response ? this.setState({ user: response.user }) : null;
      },
      error: () => {
        console.log('failed');
      }
    });
  }

  componentDidMount () {
    if (this.state.user) {
      this.getTickets();
      this.broadcastMsg();
    }
  }

  broadcastMsg() {
    let socket = io({
      query: {
        id: this.state.user.id,
        role: this.state.user.role
      }
    });
    // socket.emit('userInfo', { userInfo: this.state.user });
  }

  getTickets() {
    $.ajax({
      url: '/api/tickets/',
      type: 'GET',
      data: {
        id: this.state.user.id,
        role: this.state.user.role
      },
      success: (tickets) => {
        this.setState({ ticketList: tickets });
      },
      error: () => {
        console.log('err');
      }
    });
  }

  submitTickets(e) {
    e.preventDefault();
    let ticket = {
      userId: this.state.user.id,
      description: document.getElementById('ticket_submission_description').value,
      category: document.getElementById('ticket_submission_category').value,
      location: document.getElementById('ticket_submission_location').value,
      status: 'Opened'
    };
    console.log(`Sending Descrip: ${ticket.description}, Category: ${ticket.category} to api/tickets via POST`);
    $.ajax({
      url: 'api/tickets',
      type: 'POST',
      data: ticket,
      success: (response) => {
        console.log(`Successfully sent ${ticket} to apt/tickets via POST`);
        this.getTickets();
        document.getElementById('ticket_submission_description').value = '';
      },
      error: () => {
        console.log('Error submitting ticket to api/tickets via POST');
      }
    });
  }

  updateTickets(data) {
    if (data.status === 'Claimed') {
      data.claimedBy = this.state.user.id;
    }
    $.ajax({
      url: `api/tickets/${data.id}`,
      type: 'PUT',
      data: data,
      success: (response) => {
        this.getTickets();
      },
      error: (err) => {
        console.log('failed to update ticket');
      }
    });
  }

  filterTickets(e) {
    e.preventDefault();
    let day = document.getElementById('time-window').value;
    let startDay = new Date(new Date() - day * 24 * 60 * 60 * 1000);
    let option = {
      id: this.state.user.id,
      role: this.state.user.role,
      category: document.getElementById('select-category').value,
      status: document.getElementById('ticket-status').value,
      createdAt: { gt: startDay.toISOString() }
    };

    $.ajax({
      url: '/api/tickets/',
      type: 'GET',
      data: option,
      success: (tickets) => {
        console.log('filterTickets: ', tickets);
        this.setState({ ticketList: tickets });
      },
      error: () => {
        console.log('err');
      }
    });
  }

  render() {
    let user = this.state.user;
    let render = null;
    if (!user) {
      render = <Login />;
    } else if (user.role === 'student') {
      render = <TicketSubmission submitTickets={this.submitTickets.bind(this)} ticketCategoryList={this.state.ticketCategoryList}/>;
    } else if (user.role === 'mentor') {
      // render HIR view
    } else if (user.role === 'admin') {
      render =
      <div id="admin-view">
        <AdminDashboard />
        <AddUser />
        <AdminFilter filterTickets={this.filterTickets.bind(this)} ticketCategoryList={this.state.ticketCategoryList}/>
      </div>;
    }
    return (
      <div>
        <Nav waitTime={this.state.waitTime} user={this.state.user}/>
        <div className="col-md-8">
          {render}
          <TicketList user={this.state.user} ticketList={this.state.ticketList} updateTickets={this.updateTickets.bind(this)} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
