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
const civicFeedKey = "c91d0fa0a6msh1417965add04d7cp1caaa2jsn509bcdccbd47";           
const port = "http://localhost:9000/";

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
        const topBills = await fetch(`${port}bills/trending`, {
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
        // ===================================
        // UPDATE STATE WITH TRENDING BILLS
        // ===================================
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
      trackedBills: tracked
    }, function () {
      console.log(`LOGGED IN. ID: ${this.state._id}, BILLS: ${this.state.trackedBills}`);
    });
  }

  addBillToTracking = async (billToTrack) => {
    
    const createBillInMongo = async () => {
      const createBill = await fetch(`${port}bills/`, {
        method: 'POST',
        body: JSON.stringify({
          title: billToTrack.title,
          state: billToTrack.state,
          bill_id: billToTrack.bill_id,
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
      const isUserTracking = await fetch(`${port}users/${this.state._id}/track/${billToTrack.bill_id}`, {
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
        const updateBill = await fetch(`${port}bills/track/${billToTrack.bill_id}`, {
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
        console.log(`INCREMENTED BILL ID ${JSON.stringify(parsedUpdateBill.data.bill_id)}`)
        return parsedUpdateBill.data;
    }
    }
    const updateStateWithAddedBill = async (updatedBill) => {
      let updatedArray = [...this.state.bills];
      for (let i = 0; i < updatedArray.length; i++) {
        if (updatedArray[i].bill_id == billToTrack.bill_id) {
          updatedArray[i].trackingCount++
        }
      }

      this.setState({
        trackedBills: [...this.state.trackedBills, updatedBill],
        bills: updatedArray
      });
    }

    try {
      createBillInMongo();
      const addedBill = addToUsersTracking();
      updateStateWithAddedBill(addedBill);
    } catch (err) {
      console.log(err)
    }
  }

  untrackBill = async (billId) => {

    const decrementBillInMongo = async () => {
      const updateBill = await fetch(`${port}bills/untrack/${billId}`, {
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
      const userUntrackBill = await fetch(`${port}users/${this.state._id}/untrack/${billId}`, {
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
      decrementBillInMongo();
      removeBillFromUser();
      updateReactState();
    } catch (err) {
      console.log(err);
    }
  }

  handleRegister = async (e) => {
    e.preventDefault();
    try {
      const loginResponse = await fetch(`${port}auth/register`, {
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
      console.log('UNFILTERED RESPONSE FROM EXPRESS', loginResponse);
      console.log('JSON RESPONSE FROM EXPRESS', parsedResponse);
      const jsonString = parsedResponse.data;
      const id = JSON.parse(jsonString).userId;
      const tracked = JSON.parse(jsonString).trackedBills;
      console.log('THIS IS THE ID', id);
      if (parsedResponse.status === 200) {
        this.loginSuccess(id, tracked);
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
    try {
      const loginResponse = await fetch(`${port}users/login`, {
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
      const id = parsedResponse.userId;
      const tracked = parsedResponse.trackedBills;
      console.log('THIS IS THE ID', id);
      if (parsedResponse.status === 200) {
        this.loginSuccess(id, tracked);
      } else {
        this.setState({
          failedLogin: true
        })
      }
    } catch (err) {
      console.log(err)
    }
  }

  // ================================================================================================================
  //                                       UPDATE QUERY STATE WITH USER INPUT
  // ================================================================================================================
  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  // ====================================================================================================================
  //                                    THIS SHOULD QUERY THE API WITH USER INPUT
  // ====================================================================================================================
  getBillsFromQuery = async (e) => {
    e.preventDefault();
    // ========================
    // HERE WE MAKE AN API CALL
    // ========================
    // API PARAMS
    // ==========
    const state = this.state.userState.toLowerCase();
    let q = "";
    if (this.state.query !== "") {
      q = "&q=" + this.state.query
    }
    try {
      const response = await fetch(`https://civicfeed-civicfeed-legislation-v1.p.rapidapi.com/legislation/bills?state=${state}${q}&sort=updated_at&page=1&per_page=10`, {
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

      // ==============================
      // NOW UPDATE THE STATE WITH DATA
      // ==============================
      let uncleanArray = [...billsParsed];
      let cleanArray = [];
      for (let i = 0; i < uncleanArray.length; i++) {
        let billObj = {
          title: uncleanArray[i].title,
          summary: uncleanArray[i].summary,
          state: uncleanArray[i].state,
          bill_id: uncleanArray[i].bill_id,
          proposed: uncleanArray[i].created_at,
          lastAction: uncleanArray[i].updated_at,
          trackingCount: 0
        };
        cleanArray.push(billObj)
      }

      this.setState({
        bills: cleanArray
      });

    } catch (err) {
      console.log(err);
      return err
    }
  }

  // ====================================================================================================================
  //                                    THIS SHOULD QUERY THE API WITH USER INPUT
  // ====================================================================================================================
  getRepsFromQuery = async (e) => {
    e.preventDefault();
    // ========================
    // HERE WE MAKE AN API CALL
    // ========================
    // API PARAMS
    // ==========
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

      // ==============================
      // NOW UPDATE THE STATE WITH DATA
      // ==============================
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

        {/* NAVIGATION */}
        <Navigation setActivePage={this.setActivePage} /> <br />

        {/* SEARCH BAR - DEFAULT 1ST BUTTON */}
        <Container>
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

          {/* MAIN CONTENT */}
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
