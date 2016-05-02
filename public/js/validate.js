function validate() {
  if ($('#pass1').val() != $('#pass2').val()) {
    alert('Salasanat eivät täsmää');
    return false;
  }
  else {
    return true;
  }
}
