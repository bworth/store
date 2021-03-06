import { STR_PLACEHOLDER, deepFreeze, isPlainObject } from './';

const STORE_INIT = 'STORE_INIT';

const INVALID_ACTION = `Actions must be plain objects. Instead received action "${ STR_REPLACE_TOKEN }"`;
const INVALID_ACTION_TYPE = `Actions may not have an undefined "type" property. In action "${ STR_REPLACE_TOKEN }"`;
const INVALID_LISTENER = `Expected listener to be a function. Instead received listener "${ STR_REPLACE_TOKEN }"`;
const INVALID_PRELOADED_STATE = 'The preloadedState argument passed to createStore should be an object';
const INVALID_REDUCER = `Expected reducer to be a function. Instead received reducer "${ STR_REPLACE_TOKEN }"`;
const INVALID_REDUCERS_OBJECT = 'Not a valid reducers container. Make sure "reducers" is an object';
const INVALID_REDUCERS_PROPERTY = `Not a valid reducer, expected "reducers.${ STR_REPLACE_TOKEN }" to be a function.`;
const UNEXPECTED_DISPATCH = `Reducers may not dispatch actions. A reducer tried to dispatch "${ STR_REPLACE_TOKEN }"`;

function combineReducers(reducers) {
	if (!isPlainObject(reducers)) {
		throw new Error(INVALID_REDUCERS_OBJECT);
	}

	Object.keys(reducers).forEach(key => {
		if (typeof reducers[key] !== 'function') {
			throw new Error(INVALID_REDUCERS_PROPERTY.replace(STR_REPLACE_TOKEN, key));
		}
	});

	return (state = {}, action) => {
		const nextState = {};
		let hasChanged = false;

		if (action.type === STORE_INIT && !isPlainObject(state)) {
			throw new Error(INVALID_PRELOADED_STATE);
		}

		Object.keys(reducers).forEach(key => {
			nextState[key] = reducers[key].call(null, state[key], action);
			hasChanged = hasChanged || nextState[key] !== state[key];
		});

		return hasChanged ? nextState : state;
	};
}

function createAction(type, payload) {
	const action = { type };

	if (typeof payload !== 'undefined') {
		action.payload = payload;

		if (isError(payload)) {
			action.error = true;
		}
	}

	return deepFreeze(action);
}

function createStore(reducer, preloadedState, ...subscribers) {
	const listeners = [];
	let isDispatching = false;
	let state = deepFreeze(preloadedState);

	function dispatch(action) {
		if (!isPlainObject(action)) {
			throw new Error(INVALID_ACTION.replace(STR_REPLACE_TOKEN, action));
		}

		if (typeof action.type === 'undefined') {
			throw new Error(INVALID_ACTION_TYPE.replace(STR_REPLACE_TOKEN, action));
		}

		if (isDispatching) {
			throw new Error(UNEXPECTED_DISPATCH.replace(STR_REPLACE_TOKEN, action));
		}

		isDispatching = true;
		state = deepFreeze(reducer.call(null, getState(), deepFreeze(action)));
		isDispatching = false;

		console.log(action, state, listeners);

		listeners.forEach(listener => listener.call());

		return action;
	}

	function getState() {
		return state;
	}

	function subscribe(listener) {
		if (typeof listener !== 'function') {
			throw new Error(INVALID_LISTENER.replace(STR_REPLACE_TOKEN, listener));
		}

		listeners.push(listener);

		return () => {
			const index = listeners.indexOf(listener);

			return index > -1 ? listeners.splice(index, 1)[0] : undefined;
		};
	}

	if (typeof reducer !== 'function') {
		throw new Error(INVALID_REDUCER);
	}

	subscribers.forEach((subscriber, i) => {
		if (typeof subscriber === 'function') {
			subscribers[i] = subscriber.call(null, getState, subscribe);
		}
	});

	dispatch(createAction(STORE_INIT));

	// return Object.create(Object.prototype, {
	// 	dispatch: { value: dispatch }, getState: { value: getState }, subscribe: { value: subscribe }
	// });

	return addMethods({}, { dispatch, getState, subscribe });
}

export { STORE_INIT, combineReducers, createAction, createStore };
