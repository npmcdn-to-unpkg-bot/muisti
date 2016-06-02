 $(document).ready(function() {
  //****************************************************************************
  //  Alustus
  //****************************************************************************

  //Gridi
  $('.container').masonry({
    // options...
    itemSelector: '.memo',
    columnWidth: 164
  });


  $('.tooltip').tooltipster();

  //****************************************************************************
  //  Eventit
  //****************************************************************************
  $('.container').on('click', '.item', function(){
    if ($(this).is('li')) {
      editItem($(this));
    }
    if (!$(this).is('li') && !$(this).is('input')) clearInputs();

  });

  $('.container').on('click', '.name', function(){
    if ($(this).is('h4')) {
      editItem($(this));
    }
  });

  $('.container').on('keypress', 'input.item', function(e){
    if (e.keyCode == 13) {
      sendToServer(getAllListsToObj());
      $(this).blur();
    }
  });

  $('.container').on('keypress', 'input.name', function(e){
    if (e.keyCode == 13) {
      sendToServer(getAllListsToObj());
      $(this).blur();
    }
  });

  $('.container').on('focusout', 'input.item', function(){
      clearInputs();
      sendToServer(getAllListsToObj());

  });

  $('.container').on('focusout', 'input.name', function(){
      clearInputs();
      sendToServer(getAllListsToObj());

  });

  $('.container').on('click', '.remove', function(){
      $(this).closest('li').remove();
      sendToServer(getAllListsToObj());

  });

  $('.container').on('click', '.addnew', function() {
      var $input = $('<input type=text></input>');
      $input.addClass('item');
      $input.insertBefore($(this).closest('.addnew'));
      $input.focus();
  });

  $('.container').on('click', '.trash', function(){
      var r = confirm('Haluatko varmasti poistaa listan?');
      if (r == true) {
        var lid = $(this).siblings('.lid').text();
        removeListFromServer(lid);
        $(this).closest('.memo').remove();
      }
  });

  $('.container').on('click', '.linkify', function(){
      var lid = $(this).siblings('.lid').text();
      prompt('Anna tämä koodi kaverillesi, jakaaksesi tämän listan: ', lid);
  });

  $('#btn-test').click(function(){
    sendToServer(getAllListsToObj());
  });

  $('#btn-add-existing').click(function(){
    var lid = prompt('Anna lisättävän listan koodi:');
    addExistingList(lid);
  });

  $('#addNewList').click(function(){
    generateEmptyList();
  });

  getListatFromServer(function(res){
    generateLoadedLists(res);
  });

  setInterval(function() {
    console.log('Tallennettu');
    sendToServer(getAllListsToObj());

}, 2000);

  //****************************************************************************
  //  Generoi listat
  //****************************************************************************

  function generateLoadedLists(data) {
    for (var i = 0; i < data.length; i++) {
      var $newL = $('<div>');
      $newL.addClass('four columns memo');
      $newL.append($('<p>', {class: 'lid', text: data[i].lid}));
      $newL.append($('<h4>', {class: 'u-pull-left name', text: data[i].nimi}));
      $newL.append($('<i>', { class: 'link trash outline icon' }));
      $newL.append($('<i>', { class: 'link linkify icon' }));
      $newL.append($('<ul>'));
      for (var j = 0; j < data[i].items.length; j++) {
        $newL.children('ul').append($('<li>', {class: 'item', html: data[i].items[j]}).append($('<i class="link remove icon"></i>')));
      }
      $newL.children('ul').append($('<li>', {class: 'addnew'}).append(
        $('<i>', {class: 'link large add circle icon'})
      ));
      $('.content').append($newL);
    }
  }

 function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    });
    // or alternatively
    /*return text.replace(urlRegex, '<a href="$1">$1</a>')*/
}

  function generateEmptyList(){
    getNewLid(function(lid){
      var $newL = $('<div>');
      $newL.addClass('four columns memo');
      $newL.append(
        $('<p>', {class: 'lid', text: lid}),
        $('<h4>', {class: 'u-pull-left name', text: 'Uusi lista'}),
        $('<i>', { class: 'link trash outline icon' }),
        $('<i>', { class: 'link linkify icon' }),
        $('<ul>').append(
          $('<li>', {class: 'addnew'}).append(
            $('<i>', {class: 'link large add circle icon'})
          )
        )
      );
      $('.content').append($newL);
    });
  }

  //****************************************************************************
  //  Funkkarit
  //****************************************************************************

  function getAllListsToObj()
  {
    var objects = [];
    $('.memo').each(function(){
      var newObj = {lid:'', nimi:'', items: []};
      newObj.nimi = $(this).find('h4').text();
      newObj.lid = $(this).find('.lid').text();

      $(this).find('.item').each(function(){
        newObj.items.push($(this).text());
      });

      objects.push(newObj);
    });
    return objects;
  }

  function editItem($obj){
    var $input = $('<input type=text></input>');
    $input.val($obj.text());
    console.log($obj.get(0).tagName);
    if($obj.get(0).tagName == 'H4'){
        $input.addClass('name');
        $obj.replaceWith($input);
        $('input.name').focus();
        $('input.name').select();
    }
    else {
        $input.addClass('item');
        $obj.replaceWith($input);
        $('input.item').focus();
    }
  }

  function clearInputs(){
    $('input.item').each(function(i) {
      var $li = $('<li></li>');
      $li.text($(this).val());
      $li.addClass('item');
      $li.append($('<i class="link remove icon"></i>'));
      $(this).replaceWith($li);
    });
    $('input.name').each(function(i) {
      var $li = $('<h4></h4>');
      $li.text($(this).val());
      $li.addClass('name');
      $(this).replaceWith($li);
    });
  }
});

  //****************************************************************************
  //  API-kutsut (globaaleja)
  //****************************************************************************

  function getListatFromServer(callback){
    $.get('/get', function(data, status){
      return callback(JSON.parse(data));
    });
  }

  function getNewLid(callback)
  {
    $.ajax({ url: '/newid', async: true, success: function(result){
      console.log(result);
      return callback(result.lid.toString());
    }});
  }

  function removeListFromServer(lid){
    console.log('/'+lid);
    $.ajax({
        url: '/'+lid,
        type: 'DELETE',
        success: function(result) {
            // Do something with the result
            console.log('postettu');
        }
    });
  }

  function addExistingList(lid){
    $.ajax({
        url: '/'+lid,
        type: 'POST',
        success: function(result) {

        }
    });
  }

  function sendToServer(obj){
    console.log(JSON.stringify(obj));
    $.ajax
    ({
        type: "POST",
        //the url where you want to sent the userName and password to
        url: '/add',
        dataType: 'json',
        async: true,
        //json object to sent to the authentication url
        data: {data: JSON.stringify(obj)},
    });
  }
