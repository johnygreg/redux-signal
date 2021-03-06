[<img src="https://raw.githubusercontent.com/mikevercoelen/redux-signal/master/logo.png" class="logo" height="90" width="150"/>](http://mikevercoelen.github.io/redux-signal/)

# Redux Signal

Flexible, scalable library for creating modals with React and Redux.

* `signals`: small, quick notification modals (confirmations, alerts etc.)
* `modals`: fully customizable modals for your forms etc.

## Demo

[mikevercoelen.github.io/redux-signal](http://mikevercoelen.github.io/redux-signal/)

## Example

```js
import React from 'react'
import { withSignal, SignalTypes } from 'redux-signal'

// As an example, this app has a ProfileView. The user can upload an avatar,
// and if the avatar file is too large, we want to display a notification popup

class ProfileView extends React.Component {
  onAvatarFileUpload = () => {
    if (avatarIsToLarge) { // use your imagination...
      this.props.createSignal({
        type: SignalTypes.OK,
        title: 'Warning',
        message: 'The file was too large'
      })
    }
  }

  render () {
    // ...
  }
}

export default withSignal(ProfileView)
```

More example code [available here](https://github.com/mikevercoelen/redux-signal/tree/master/examples)

## Table of Contents

- [Installation](#installation)
- [Introduction](#introduction)
  - [The problem](#the-problem)
  - [How does it work](#how-does-it-work?)
- [Setup](#setup)
  - [Reducer](#reducer-setup)
  - [SignalContainer](#signalcontainer-setup)
- [Signals](#signals)
  - [Signal types](#signal-types)
  - [Handling events](#handling-events)
- [Modals](#modals)
- [Overlay](#overlay)
- [API](#api)
  - [createContainer](#createcontainer)
  - [withSignal](#withsignal)
  - [createSignal](#createsignal)
  - [getHasVisibleModal](#gethasvisiblemodal)
  

## Installation

`npm install redux-signal --save`

## Introduction

### The problem
Setting up a flexible solution for modals with Redux is hard. Our apps mostly need 2 types of modals: simple modals (such as confirms / warnings etc.) and custom modals. 

We might need multiple modals open at once, so we need some stacking order and we only want to display one overlay component. We also want our Redux state to be clean and serializable.

So meet Redux Signal, hi.

In Redux Signal there are 2 types of modals: ***signals*** and ***modals***. Signals are simple notifications: like warnings when things go wrong, confirmations when a user tries to removing an item, or user feedback when an item has been removed etc. Modals are fully customizable, modals. Like login popups etc.

***NOTE***:

Redux Signal is not a library for the styling of your modals, that is your responsibility, however we made [`react-modal-construction-kit`](https://github.com/mikevercoelen/react-modal-construction-kit) for making your life even easier.

Check out the [examples](https://github.com/mikevercoelen/redux-signal/tree/master/examples) for more info.

### How does it work?
Redux Signal uses an `event / feedback queue` mechanism for signals so we handle events in a clean way, without cluttering our app state with functions etc. See [Handling events](#handling-events) for more info.

## Setup

### Reducer setup

The first thing you need to do is to include the signal reducer in your rootReducer. Please make sure it's mounted at your rootReducer as `signal`, we are working on making this flexible in the future.

`reducers/index.js`

```js
import { combineReducers } from 'redux'
import { reducer as signalReducer } from 'redux-signal'

export const rootReducer = combineReducers({
  signal: signalReducer
})
```

### SignalContainer setup

The second thing you need to do, is to create a `SignalContainer`. Again: Redux-signal is not responsible for your Modal look and feel, you need your own Modal component ([`react-modal-construction-kit`](https://github.com/mikevercoelen/react-modal-construction-kit))

The `SignalContainer` is ***the link between signal and your modal component***

So let's create a `SignalContainer` component:

`containers/SignalContainer.js`

```js
import React from 'react'
import PropTypes from 'prop-types'

// These are your application specific components we use in this demo example
import Button from '../components/Button/Button'
import Modal from '../components/Modal/Modal'

import {
  createContainer,
  SignalEvents,
  SignalTypes
} from 'redux-signal'

const SignalContainer = ({
  event,
  destroy,
  close,
  modal
}) => {
  // modal contains all the properties you submit when calling `createSignal`, so you have all the freedom
  // to do whatever you want (title, message, isRequired) only isFirst and isVisible are required.

  return (
    <Modal
      isOpen={modal.isVisible}
      title={modal.title}
      onClosed={close}
      footer={getFooter(modal, eventType => event(modal, eventType))}>
      {modal.message}
    </Modal>
  )
}

SignalContainer.propTypes = {
  event: PropTypes.func,
  destroy: PropTypes.func,
  close: PropTypes.func,
  modal: PropTypes.object
}

function getModalLabel (modal, labelType, otherwise) {
  return (modal.labels && modal.labels[labelType]) || <span>{otherwise}</span>
}

function getFooter (modal, onModalEvent) {
  switch (modal.type) {
    case SignalTypes.YES_NO:
      return [
        <Button
          key='no'
          reject
          onClick={() => onModalEvent(SignalEvents.BTN_NO)}>
          {getModalLabel(modal, 'no', 'Nope')}
        </Button>,
        <Button
          key='yes'
          primary
          onClick={() => onModalEvent(SignalEvents.BTN_YES)}>
          {getModalLabel(modal, 'yes', 'Yep')}
        </Button>
      ]
    case SignalTypes.YES_NO_CANCEL:
      return [
        <Button
          key='cancel'
          onClick={() => onModalEvent(SignalEvents.BTN_CANCEL)}>
          {getModalLabel(modal, 'cancel', 'Cancel')}
        </Button>,
        <Button
          key='no'
          reject
          onClick={() => onModalEvent(SignalEvents.BTN_NO)}>
          {getModalLabel(modal, 'no', 'Nope')}
        </Button>,
        <Button
          key='yes'
          reject
          onClick={() => onModalEvent(SignalEvents.BTN_YES)}>
          {getModalLabel(modal, 'yes', 'Yep')}
        </Button>
      ]

    case SignalTypes.OK_CANCEL:
      return [
        <Button
          key='cancel'
          onClick={() => onModalEvent(SignalEvents.BTN_CANCEL)}>
          {getModalLabel(modal, 'cancel', 'Cancel')}
        </Button>,
        <Button
          key='ok'
          primary
          onClick={() => onModalEvent(SignalEvents.BTN_OK)}>
          {getModalLabel(modal, 'ok', 'Ok')}
        </Button>
      ]
    case SignalTypes.OK:
      return (
        <Button
          primary
          onClick={() => onModalEvent(SignalEvents.BTN_OK)}>
          {getModalLabel(modal, 'ok', 'Ok')}
        </Button>
      )
  }

  return null
}

export default createContainer(SignalContainer)
```

Once you've created the `SignalContainer` (which, again, is the link between your Modal and `redux-signal`) you have to use it somewhere in your application.
The most logical place would be your main layout, use it like so:

```js
<SignalContainer />
```

Now you've setup everything you need for `redux-signal` and can start using `createSignal` to show `signals`.

## Signals

### Showing a signal

1. Wrap the component where you want to show a signal with [`withSignal`](#withsignal), which injects the component with a few props from which one is called: `createSignal`.
2. Use [`createSignal`](#createsignal) to show a signal.

Example:

`components/Demo.js`

```js
import React from 'react'

import {
  withSignal,
  withSignalPropTypes,
  SignalTypes
} from 'redux-signal'

const Demo = ({ createSignal }) => {
  return (
    <div>
      <button
        onClick={() => {
          createSignal({
            type: SignalTypes.OK,
            title: 'hi',
            message: 'Hello world'
          })
        }}>
        Show ok
      </button>
    </div>
  )
}

Demo.propTypes = {
  ...withSignalPropTypes
}

export default withSignal(Demo)
```

### Signal types

There are 4 `SignalTypes`:

* `OK`
* `OK_CANCEL`
* `YES_NO`
* `YES_NO_CANCEL`

It's your responsibility for handling the signal type in the `SignalContainer`, in our example [SignalContainer](#signalcontainer-setup) you can see the `type` is being used to show different buttons.

More info see [createSignal API](#createsignal)

### Handling events

Lets say you want to have a confirmation popup when a user wants to remove an item. You want to handle the events when clicked on the `yes` button or `no` button. You can do so by using `eventHandler`

```js
import React from 'react'

import {
  withSignal,
  withSignalPropTypes,
  SignalTypes,
  eventHandler
} from 'redux-signal'

const KillTheWorldEvents = eventHandler()

const Demo = ({ createSignal }) => {
  return (
    <div>
      <button
        onClick={() => {
          createSignal({
            type: SignalTypes.YES_NO,
            eventHandler: KillTheWorldEvents,
            title: 'Please confirm',
            message: 'Are you sure you want to kill the world?'
          })
        }}>
        Kill the world
      </button>
      <KillTheWorldEvents
        onYes={() => window.alert("You have killed the world.")}
        onNo={() => window.alert("Thank god, you are a good kid."} />
    </div>
  )
}

Demo.propTypes = {
  ...withSignalPropTypes
}

export default withSignal(Demo)
```

## Modals

TODO: for now check out the [modal examples code](https://github.com/mikevercoelen/redux-signal/blob/master/examples/components/ModalLogin/ModalLogin.js).

## Overlay

TODO: for now check out the [SignalOverlayContainer in the examples code](https://github.com/mikevercoelen/redux-signal/blob/master/examples/containers/SignalOverlayContainer.js).

## API

### createContainer

The following props will be available once a component has been wrapped with `createContainer`:

| Property | Type | Description |
|:---|:---|:---|
| `event` | function | Dispatch a signal event |
| `close` | function | Closes the signal, not to be confused with `destroy`, which removes the DOM element. Close should be used to close, destroy on transition end |
| `destroy` | function | Destroys the signal, should be used on transition end when using a transitioned modal, see examples for more info on it's use |
| `modal` | object | All the props passed to `createSignal` |

### withSignal

The following props will be available once a component has been wrapped with `withSignal`:

| Property | Type | Description |
|:---|:---|:---|
| `createSignal` | function({ type, ...props }) | See [createSignal](#createsignal) |
| `signalEvent` | function | Dispatch a signal event |
| `setModalState` | function(modalId, ModalState) | Set the state of a modal |
| `showModal` | function(modalId) | Shows a modal |
| `hideModal` | function(modalId) | Hides a modal |

### createSignal

This method will be available in the props of a component wrapped with `withSignal`

The method expects an object with the following parameters:

| Property | Type | Default | Description |
|:---|:---|:---|:---|
| `type` | SignalType (enum) | - | The type of Signal see: [Signal types](#signal-types) |
| `eventHandler` | EventHandler | - | ***(optional)*** pass in an EventHandler to handle events |
| `...props` | - | - | All other props passed to `createSignal` can be accessed in your `SignalContainer`'s `modal` object prop, see [createContainer](#createcontainer) |

### getHasVisibleModal

This is a selector, and returns true or false if a modal OR signal is visible, this can be used to render an overlay component

| Property | Type | Default | Description |
|:---|:---|:---|:---|
| `state` | object | - | Your application state |
