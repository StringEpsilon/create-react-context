import React, { Component } from 'react';
import PropTypes from 'prop-types';
import warning from 'tiny-warning';

const commonjsGlobal: any =
  typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
  ? global
  : typeof self !== 'undefined'
  ? self
  : {};

function getUniqueId() {
  const key = '__global_unique_id__';
  return commonjsGlobal[key] = (commonjsGlobal[key] || 0) + 1;
}

const MAX_SIGNED_31_BIT_INT = 1073741823;

// Inlined Object.is polyfill.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
function objectIs(x: any, y: any) {
	if (x === y) {
		return x !== 0 || 1 / x === 1 / y;
	} else {
		return x !== x && y !== y;
	}
}


export type ConsumerState<T> = {
	value: T
};

type RenderFn<T> = (value: T) => React.ReactNode;

export type Context<T> = {
	Provider: React.ComponentClass<ProviderProps<T>>;
	Consumer: React.ComponentClass<ConsumerProps<T>>;
};

export type ProviderProps<T> = {
	value: T;
	children?: React.ReactNode;
	observedBits?: any,
};

export type ConsumerProps<T> = {
	children: RenderFn<T> | [RenderFn<T>];
	observedBits?: number;
};



function createEventEmitter(value: any) {
	let handlers: any[] = [];
	return {
		on(handler: any) {
			handlers.push(handler);
		},

		off(handler: any) {
			handlers = handlers.filter(h => h !== handler);
		},

		get() {
			return value;
		},

		set(newValue: any, changedBits: any) {
			value = newValue;
			handlers.forEach(handler => handler(value, changedBits));
		}
	};
}

function onlyChild(children: any): any {
	return Array.isArray(children) ? children[0] : children;
}

export default function createReactContext<T>(defaultValue: T, calculateChangedBits?: (a: T, b: T) => number): Context<T> {
	const contextProp = '__create-react-context-' + getUniqueId() + '__';

	class Provider extends Component<ProviderProps<T>> {
		emitter = createEventEmitter(this.props.value);

		static childContextTypes = {
			[contextProp]: PropTypes.object.isRequired
		};

		getChildContext() {
			return {
				[contextProp]: this.emitter
			};
		}

		componentWillReceiveProps(nextProps: any) {
			if (this.props.value !== nextProps.value) {
				let oldValue = this.props.value;
				let newValue = nextProps.value;
				let changedBits: number;

				if (objectIs(oldValue, newValue)) {
					changedBits = 0; // No change
				} else {
					changedBits =
						typeof calculateChangedBits === 'function'
							? calculateChangedBits(oldValue, newValue)
							: MAX_SIGNED_31_BIT_INT;
					if (process.env.NODE_ENV !== 'production') {
						warning(
							(changedBits & MAX_SIGNED_31_BIT_INT) === changedBits,
							'calculateChangedBits: Expected the return value to be a ' +
							'31-bit integer. Instead received: ' + changedBits,
						);
					}

					changedBits |= 0;

					if (changedBits !== 0) {
						this.emitter.set(nextProps.value, changedBits);
					}
				}
			}
		}

		render() {
			return this.props.children;
		}
	}

	class Consumer extends Component<ConsumerProps<T>, ConsumerState<T>> {
		static contextTypes = {
			[contextProp]: PropTypes.object
		};

		observedBits!: number;

		state: ConsumerState<T> = {
			value: this.getValue()
		};

		componentWillReceiveProps(nextProps: any) {
			let { observedBits } = nextProps;
			this.observedBits =
				observedBits === undefined || observedBits === null
					? MAX_SIGNED_31_BIT_INT // Subscribe to all changes by default
					: observedBits;
		}

		componentDidMount() {
			if (this.context[contextProp]) {
				this.context[contextProp].on(this.onUpdate);
			}
			let { observedBits } = this.props;
			this.observedBits =
				observedBits === undefined || observedBits === null
					? MAX_SIGNED_31_BIT_INT // Subscribe to all changes by default
					: observedBits;
		}

		componentWillUnmount() {
			if (this.context[contextProp]) {
				this.context[contextProp].off(this.onUpdate);
			}
		}

		getValue(): T {
			if (this.context[contextProp]) {
				return this.context[contextProp].get();
			} else {
				return defaultValue;
			}
		}

		onUpdate = (newValue: any, changedBits: number) => {
			const observedBits: number = this.observedBits | 0;
			if ((observedBits & changedBits) !== 0) {
				this.setState({ value: this.getValue() });
			}
		};

		render() {
			return onlyChild(this.props.children)(this.state.value);
		}
	}

	return {
		Provider,
		Consumer
	};
}

