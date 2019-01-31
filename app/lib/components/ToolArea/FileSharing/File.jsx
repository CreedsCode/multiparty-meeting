import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRoomContext } from '../../../RoomContext';
import magnet from 'magnet-uri';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';

const DEFAULT_PICTURE = 'resources/images/avatar-empty.jpeg';

class File extends Component
{
	render()
	{
		const {
			roomClient,
			torrentSupport,
			file
		} = this.props;

		return (
			<div className='file-entry'>
				<img className='file-avatar' src={file.picture || DEFAULT_PICTURE} />
	
				<div className='file-content'>
					<Choose>
						<When condition={file.me}>
							<p>You shared a file.</p>
						</When>
						<Otherwise>
							<p>{file.displayName} shared a file.</p>
						</Otherwise>
					</Choose>

					<If condition={!file.active && !file.files}>
						<div className='file-info'>
							<Choose>
								<When condition={torrentSupport}>
									<Button
										variant='contained'
										color='default'
										onClick={() =>
										{
											roomClient.handleDownload(file.magnetUri);
										}}
									>
										<CloudDownloadIcon className='leftButtonIcon' />
										Download
									</Button>
								</When>
								<Otherwise>
									<p>
										Your browser does not support downloading files using WebTorrent.
									</p>
								</Otherwise>
							</Choose>
							<p>{magnet.decode(file.magnetUri).dn}</p>
						</div>
					</If>

					<If condition={file.timeout}>
						<Fragment>
							<p>
								If this process takes a long time, there might not be anyone seeding
								this torrent. Try asking someone to reupload the file that you want.
							</p>
						</Fragment>
					</If>

					<If condition={file.active}>
						<progress value={file.progress} />
					</If>

					<If condition={file.files}>
						<Fragment>
							<p>File finished downloading.</p>

							{file.files.map((sharedFile, i) => (
								<div className='file-info' key={i}>
									<Button
										variant='contained'
										color='default'
										onClick={() =>
										{
											roomClient.saveFile(sharedFile);
										}}
									>
										<SaveIcon className='leftButtonIcon' />
										Save
									</Button>
									<p>{sharedFile.name}</p>
								</div>
							))}
						</Fragment>
					</If>
				</div>
			</div>
		);
	}
}

File.propTypes = {
	roomClient     : PropTypes.object.isRequired,
	torrentSupport : PropTypes.bool.isRequired,
	file           : PropTypes.object.isRequired
};

const mapStateToProps = (state, { magnetUri }) =>
{
	return {
		file           : state.files[magnetUri],
		torrentSupport : state.room.torrentSupport
	};
};

export default withRoomContext(connect(
	mapStateToProps
)(File));