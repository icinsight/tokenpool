
const $ = require('jquery');
import Vue from 'vue';


var io = require('socket.io-client');


var app;
var dashboardData;


var solutiontxlist;
var transfertxlist;
var jumbotron;

export default class HomeRenderer {

    init( )
    {

      var self = this;

      this.transactionListData = {
        txData: [ ]
      }


      var current_hostname = window.location.hostname;

      const socketServer = 'http://'+current_hostname+':4000';

      const options = {transports: ['websocket'], forceNew: true};
      this.socket = io(socketServer, options);


      // Socket events
      this.socket.on('connect', () => {
        console.log('connected to socket.io server');
      });


      this.socket.on('disconnect', () => {
        console.log('disconnected from socket.io server');
      });


      this.socket.on('activeTransactionData', function (data) {
      //  console.log('got transactionData', JSON.stringify(data));

      var solution_list = [];
      var transfer_list = [];

        for(var i in data )
        {
          var formattedStatus =  self.getFormattedStatus(data[i].receiptData)
          data[i].formattedStatus = formattedStatus;

          if(formattedStatus == '?'){formattedStatus = 'unknown'}
          data[i].htmlClass = "tx-row status-"+ formattedStatus;

          if(data[i].txHash){
            data[i].txURL = ("https://etherscan.io/tx/"+ data[i].txHash.toString());
          }

          data.sort(function(a, b) {
              return b.block - a.block;
            });


          if( data[i].txType=='solution'  )
          {
            solution_list.push( data[i] )
          }
          if( data[i].txType=='transfer'  )
          {
            transfer_list.push( data[i] )
          }

        }

       console.log('got transactionData', JSON.stringify(data));



       Vue.set(solutiontxlist.transactions, 'tx_list',  solution_list.slice(0,25) )
       Vue.set(transfertxlist.transactions, 'tx_list',  transfer_list.slice(0,25) )

      });

      this.socket.on('poolData', function (data) {
        console.log('got poolData ', JSON.stringify(data));


      //  self.accountListData.minerAccountData = data;

        Vue.set(jumbotron.pool, 'poolData',  data )

        var address = data.address;
        var etherscanContractURL = "https://etherscan.io/address/"+address.toString();

        Vue.set(jumbotron.pool, 'etherscanContractURL',  etherscanContractURL )

      });



      solutiontxlist = new Vue({
          el: '#solutiontxlist',
          data: {
            //parentMessage: 'Parent',
            transactions: {
              tx_list: this.transactionListData.txData
            }
          }
        })

       transfertxlist = new Vue({
            el: '#transfertxlist',
            data: {
              //parentMessage: 'Parent',
              transactions: {
                tx_list: this.transactionListData.txData
              }
            }
          })


         jumbotron = new Vue({
        el: '#jumbotron',
        data:{
          pool:{
            poolData: { address:'' },
            etherscanContractURL: {}
           }
         }
      });

      this.show();

      console.log('Emit to websocket')
       this.socket.emit('getPoolData');
       this.socket.emit('getActiveTransactionData');

    }


    getFormattedStatus(receiptData)
    {
        if(receiptData.success) return 'success';
      if(receiptData.mined) return 'mined';
      if(receiptData.pending) return 'pending';
      if(receiptData.queued) return 'queued';
      return '?'
    }


     update(renderData)
    {

      this.socket.emit('getPoolData');
      this.socket.emit('getActiveTransactionData');


        this.show();
    }

    hide()
    {
      $('#dashboard').hide();
    }

    show()
    {
      $('#dashboard').show();
    }

}
