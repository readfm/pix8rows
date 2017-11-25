var ipfs = window.ipfs = window.IpfsApi();
window.Buffer = ipfs.Buffer;

ipfs.url = function(id){
	//'https://gateway.ipfs.io/ipfs/'+id;
	return 'http://127.0.1:8080/ipfs/'+id;
}