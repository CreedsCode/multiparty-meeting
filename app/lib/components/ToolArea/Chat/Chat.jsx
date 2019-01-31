import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRoomContext } from '../../../RoomContext';
import MessageList from './MessageList';
import Button from '@material-ui/core/Button';
import SendIcon from '@material-ui/icons/Send';

class Chat extends Component
{
	createNewMessage(text, sender, name, picture)
	{
		return {
			type : 'message',
			text,
			time : Date.now(),
			name,
			sender,
			picture
		};
	}

	render()
	{
		const {
			roomClient,
			senderPlaceHolder,
			autofocus,
			displayName,
			picture
		} = this.props;

		return (
			<div data-component='Chat'>
				<MessageList />
				<form
					data-component='Sender'
					onSubmit={(e) =>
					{
						e.preventDefault();
						const userInput = e.target.message.value;

						if (userInput)
						{
							const message = this.createNewMessage(userInput, 'response', displayName, picture);

							roomClient.sendChatMessage(message);
						}
						e.target.message.value = '';
					}}
				>
					<input
						type='text'
						className='new-message'
						name='message'
						placeholder={senderPlaceHolder}
						autoFocus={autofocus}
						autoComplete='off'
					/>
					<Button
						variant='contained'
						color='default'
						type='submit'
					>
						Send
						<SendIcon className='rightButtonIcon'/>
					</Button>
				</form>
			</div>
		);
	}
}

Chat.propTypes =
{
	roomClient        : PropTypes.any.isRequired,
	senderPlaceHolder : PropTypes.string,
	autofocus         : PropTypes.bool,
	displayName       : PropTypes.string,
	picture           : PropTypes.string
};

Chat.defaultProps =
{
	senderPlaceHolder : 'Type a message...',
	autofocus         : false,
	displayName       : null
};

const mapStateToProps = (state) =>
{
	return {
		displayName : state.me.displayName,
		picture     : state.me.picture
	};
};

const ChatContainer = withRoomContext(connect(
	mapStateToProps
)(Chat));

export default ChatContainer;
