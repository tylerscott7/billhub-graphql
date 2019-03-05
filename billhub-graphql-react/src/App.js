import React, { Component } from 'react';
import './App.css';
import TrackingContainer from './Pages/TrackingContainer/TrackingContainer';
import TrendingContainer from './Pages/TrendingContainer/TrendingContainer';
import Navigation from './Navigation/Navigation';
import BillContainer from './Pages/BillContainer/BillContainer';
import RepContainer from './Pages/RepContainer/RepContainer';
import SearchBar from './SearchBar/SearchBar';
import { Route, Switch } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import statesArray from './statesArray';
const civicFeedKey = "c91d0fa0a6msh1417965add04d7cp1caaa2jsn509bcdccbd47";           
//const port = "http://localhost:9000/";

// Failed navigation
const My404 = () => {
  return (
    <div>
      You are lost!!!
    </div>
  )
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      dropdownOpen: false,
      logged: false,
      failedLogin: false,
      failedRegister: false,
      _id: null,
      userState: "CO",
      activePage: 'tracking',
      query: '',
      queryBtn: 0,
      bills: [],
      trackedBills: [],
      trendingBills: [],
      trackedReps: [],
      reps: []
    }
  }

  toggleDropdown = () => {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  getTrendingBills = async () => {
    try {
        const topBills = await fetch(`${process.env.REACT_APP_BACKEND}bills/trending`, {
            method: 'GET',
            credentials: 'include',
            headers: {
            'Content-Type': 'application/json'
            }
        });
        if(!topBills.ok){
            throw Error(topBills.statusText)
        }
        const parsedTopBills = await topBills.json();
        this.updateTrending(parsedTopBills.data);
        console.log(`Trending bills response from Express API:${parsedTopBills.data}`)
    } catch(err){
        console.log(err)
    }
  }

  updateTrending = (data) => {
    console.log(`We are about to update Trending Bills with: ${data}`);
    this.setState({
      trendingBills: data
    }, function() {
      console.log(`Our new state is: ${this.state.trendingBills}`)
    });
  }

  changeStateSelection = (e) => {
    this.setState({
      userState: e.target.name
    }, function () {
      console.log(`USER'S STATE IS NOW: ${this.state.userState}`)
    });
  }

  handleSearchInput = (e) => {
    this.setState({
      query: e.target.value
    }, function () {
      console.log(`SEARCHBAR SHOWS: ${this.state.query}`)
    });
  }
 
  onRadioBtnClick = (btn) => {
    this.setState({
      queryBtn: btn
    }, function () {
      console.log(`Radio Button should now be: ${this.state.queryBtn}`);
    });
  }

  setActivePage = (page) => {
    this.setState({ 
      activePage: page
    }, function() {
      if (page === "trending"){
        this.getTrendingBills();
      }
    });
  }

  loginSuccess = (userId, trackedBills) => {
    let tracked = [];
    if (trackedBills) {
      tracked = trackedBills
    }
    this.setState({
      logged: true,
      failedEntry: false,
      _id: userId,
      trackedBills: trackedBills
    }, function () {
      console.log(`LOGGED IN. ID: ${this.state._id}, BILLS: ${this.state.trackedBills}`);
    });
  }

  addBillToTracking = async (billToTrack) => {
    
    const cleanedId = billToTrack.bill_id.split('/').join('');

    const createBillInMongo = async () => {
      const createBill = await fetch(`${process.env.REACT_APP_BACKEND}bills/`, {
        method: 'POST',
        body: JSON.stringify({
          title: billToTrack.title,
          state: billToTrack.state,
          bill_id: cleanedId,
          summary: billToTrack.summary,
          proposed: billToTrack.created_at,
          lastAction: billToTrack.updated_at,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!createBill.ok) {
        throw Error(createBill.statusText)
      }
      const parsedCreateBill = await createBill.json();
      console.log(`TRIED TO CREATE BILL, NODE SENT:${JSON.stringify(parsedCreateBill)}`)
    }
    const addToUsersTracking = async () => {
      const isUserTracking = await fetch(`${process.env.REACT_APP_BACKEND}users/${this.state._id}/track/${cleanedId}`, {
        method: 'PUT',
        body: JSON.stringify({
          bill: billToTrack,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!isUserTracking.ok) {
        throw Error(isUserTracking.statusText)
      }
      const parsedIsUserTracking = await isUserTracking.json();
      console.log("RESPONSE TO TRYING TO TRACK BILL:" + JSON.stringify(parsedIsUserTracking));

      if (parsedIsUserTracking.status == 200) {
        const updateBill = await fetch(`${process.env.REACT_APP_BACKEND}bills/track/${cleanedId}`, {
          method: 'PUT',
          body: JSON.stringify({
            increment: 1,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!updateBill.ok) {
          throw Error(updateBill.statusText)
        }
        const parsedUpdateBill = await updateBill.json();
        console.log(`INCREMENTED BILL ID ${JSON.stringify(parsedUpdateBill)}`)
        return parsedUpdateBill.data;
      }
    }
    const updateStateWithAddedBill = async (updatedBill) => {
      if (updatedBill) {
        let updatedArray = [...this.state.bills];
        for (let i = 0; i < updatedArray.length; i++) {
          if (updatedArray[i].bill_id == updatedBill.bill_id) {
            updatedArray[i].trackingCount++
          }
        }
        this.setState({
          trackedBills: [...this.state.trackedBills, updatedBill],
          bills: updatedArray
        });
      } else {
        console.log("Something went wrong...")
      }
    }

    try {
      await createBillInMongo();
      const addedBill = await addToUsersTracking();
      await updateStateWithAddedBill(addedBill);
    } catch (err) {
      console.log(err)
    }
  }

  untrackBill = async (billId) => {

    const decrementBillInMongo = async () => {
      const updateBill = await fetch(`${process.env.REACT_APP_BACKEND}bills/untrack/${billId}`, {
        method: 'PUT',
        body: JSON.stringify({
          increment: -1,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!updateBill.ok) {
        throw Error(updateBill.statusText)
      }
      const parsedUpdateBill = await updateBill.json();
    }
    const removeBillFromUser = async () => {
      const userUntrackBill = await fetch(`${process.env.REACT_APP_BACKEND}users/${this.state._id}/untrack/${billId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!userUntrackBill.ok) {
        throw Error(userUntrackBill.statusText)
      }
      const parsedUntrackBill = await userUntrackBill.json();
      console.log(`UNTRACKED BILL ${JSON.stringify(parsedUntrackBill.data.bill_id)}`)

      if (parsedUntrackBill.status == 200) {
        let billIds = [];
        for (let i = 0; i < this.state.trackedBills; i++) {
          billIds.push(this.state.trackedBills[i].bill_id)
        }
        console.log(`TRACKED BILLS: ${JSON.stringify(billIds)}`)
      }
    }
    const updateReactState = async() => {
      let arr = [];
        this.state.trackedBills.forEach((bill) => {
          if (bill.bill_id !== billId) {
            arr.push(bill);
          }
        })

        let updatedArray = [...this.state.bills];
        for (let i = 0; i < updatedArray.length; i++) {
          if (updatedArray[i].bill_id == billId && updatedArray[i].trackingCount) {
            updatedArray[i].trackingCount--
          }
        }

        this.setState({
          trackedBills: arr,
          bills: updatedArray
        }, function () {
          // Update trending counts
          this.getTrendingBills();
        });
    }

    try {
      await decrementBillInMongo();
      await removeBillFromUser();
      await updateReactState();
    } catch (err) {
      console.log(err);
    }
  }

  handleRegister = async (e) => {
    e.preventDefault();

    const registrationResponse = async () => {
      const loginResponse = await fetch(`${process.env.REACT_APP_BACKEND}users/register`, {
        method: 'POST',
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password,
          email: this.state.email,
          trackedBills: [],
          trackedReps: []
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!loginResponse.ok) {
        throw Error(loginResponse.statusText)
      }
      const parsedResponse = await loginResponse.json();
      console.log('JSON RESPONSE FROM EXPRESS', parsedResponse);
      return parsedResponse;
    }

    try {
      const registerData = await registrationResponse();
      console.log(`register data: ${registerData}`)
      if (registerData.status == 200) {
        console.log("we got here")
        console.log(`Logging in w/ id: ${registerData.data.userId} & bills: ${registerData.data.trackedBills} `)
        this.loginSuccess(registerData.data.userId, registerData.data.trackedBills);
      } else {
        this.setState({
          failedRegister: true
        });
      }
    } catch (err) {
      console.log(err)
    }
  }

  handleLogin = async (e) => {
    e.preventDefault();

    const loginResponse = async () => {
      const loginResponse = await fetch(`${process.env.REACT_APP_BACKEND}users/login`, {
        method: 'POST',
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!loginResponse.ok) {
        throw Error(loginResponse.statusText)
      }
      const parsedResponse = await loginResponse.json();
      console.log('JSON RESPONSE FROM EXPRESS', parsedResponse);
      return parsedResponse;
    }

    try {
      const loginData = await loginResponse();
      console.log(`Heres login data: ${loginData}`);
      if (loginData.status == 200) {
        console.log(`this is the login data: ${loginData}`)
        this.loginSuccess(loginData.data.userId, loginData.data.trackedBills);
      } else {
        this.setState({
          failedLogin: true
        })
      }
    } catch (err) {
      console.log(err)
    }
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  getBillsFromQuery = async (e) => {
    e.preventDefault();
    // Filter to make state unabbreviated
    let state = "";
    for (let key in statesArray) {
      if (key == this.state.userState) {
        state = statesArray[key]
      }
    }
    console.log(`we are injecting this state into the query: ${state}`)
    // Not sure how to inject this query string into GraphQL query...
    // let q = "";
    // if (this.state.query !== "") {
    //   q = "&q=" + this.state.query
    // }
    try {
      const graphql_query = `query{bills(first:10,jurisdiction:"${state}"){edges{node{title abstracts{abstract} id createdAt updatedAt legislativeSession{jurisdiction{name}}}}}}`;
      const cors_api_host = 'cors-anywhere.herokuapp.com';
      const cors_api_url = 'https://' + cors_api_host + '/';
      const response = await fetch(`${cors_api_url}https://openstates.org/graphql`, {
        method: 'POST',
        body: JSON.stringify({
          query: graphql_query
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': '70a944df-df9d-48e6-b38a-29b09cd7c3db'
        },
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
      const billsParsed = await response.json();
      console.log(`API reponse: ${JSON.stringify(billsParsed.data.bills.edges)}`)

      let uncleanArray = [...billsParsed.data.bills.edges];
      let cleanArray = [];
      let summary = "";
      for (let i = 0; i < uncleanArray.length; i++) {
        if (uncleanArray[i].node.abstracts[0]){
          summary = uncleanArray[i].node.abstracts[0].abstract;
        }
        let billObj = {
          title: uncleanArray[i].node.title,
          summary: summary,
          state: uncleanArray[i].node.legislativeSession.jurisdiction.name,
          bill_id: uncleanArray[i].node.id.split('/').join(''),
          proposed: uncleanArray[i].node.createdAt,
          lastAction: uncleanArray[i].node.updatedAt,
          trackingCount: 0
        };
        cleanArray.push(billObj)
        console.log(JSON.stringify(billObj));
      }

      this.setState({
        bills: cleanArray
      });

    } catch (err) {
      console.log(err);
      return err
    }
  }

  getRepsFromQuery = async (e) => {
    e.preventDefault();
    const state = this.state.userState.toLowerCase();
    try {
      const response = await fetch(`https://civicfeed-civicfeed-legislation-v1.p.rapidapi.com/legislation/legislators/?state=${state}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-RapidAPI-Key': civicFeedKey
        },
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
      const billsParsed = await response.json();

      let uncleanArray = [...billsParsed];
      let cleanArray = [];
      for (let i = 0; i < 10; i++) {
        let repObj = {
          firstName: uncleanArray[i].first_name,
          lastName: uncleanArray[i].last_name,
          state: uncleanArray[i].state,
          party: uncleanArray[i].party,
          image: ""
        };
        cleanArray.push(repObj)
      }

      this.setState({
        reps: cleanArray
      });

    } catch (err) {
      console.log(err);
      return err
    }
  }

  render() {
    return (
      <div id="container">

        <Navigation setActivePage={this.setActivePage} /> <br />

        <Container id="searchContainer">
          <Row className="justify-content-center">
            <Col xs={{ size: 'auto' }}>
              <SearchBar
                getBillsFromQuery={this.getBillsFromQuery}
                getRepsFromQuery={this.getRepsFromQuery}
                onRadioBtnClick={this.onRadioBtnClick}
                selected={this.state.queryBtn}
                handleSearchInput={this.handleSearchInput}
                dropdownOpen={this.state.dropdownOpen}
                toggleDropdown={this.toggleDropdown}
                userState={this.state.userState}
                changeStateSelection={this.changeStateSelection}
                page={this.state.activePage}
              />
            </Col>
          </Row> <br />

          <main>
            <Switch>
              <Route exact path="/(|tracking)" render={(routeProps) => (
                <TrackingContainer {...routeProps}
                  logged={this.state.logged}
                  trackedBills={this.state.trackedBills}
                  trackedReps={this.state.trackedReps}
                  untrackBill={this.untrackBill}
                  handleLogin={this.handleLogin}
                  handleChange={this.handleChange}
                  handleRegister={this.handleRegister} />)}
              />

              <Route exact path="/trending" render={(routeProps) => 
                (<TrendingContainer {...routeProps} 
                  untrackBill={this.untrackBill} 
                  addBillToTracking={this.addBillToTracking} 
                  bills={this.state.trendingBills} 
                  updateTrending={this.updateTrending} 
                  trackedBills={this.state.trackedBills}
                  logged={this.state.logged} />)}
              />

              <Route exact path="/bills" render={(routeProps) =>
                (<BillContainer {...routeProps}
                  untrackBill={this.untrackBill}
                  trackedBills={this.state.trackedBills}
                  bills={this.state.bills}
                  addBillToTracking={this.addBillToTracking}
                  logged={this.state.logged}
                />)}
              />

              <Route exact path="/legislators" render={(routeProps) =>
                (<RepContainer {...routeProps}
                  info={this.state.reps} />)}
              />

              <Route component={My404} />
            </Switch>
          </main>
        </Container>

      </div>
    );
  }
}

export default App;
