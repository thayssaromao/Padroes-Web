document.addEventListener('submit', async (e) => {
  if (!e.target.matches('.form-contato')) return;

  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const feedback = form.querySelector('.feedback-form');
  const formData = new FormData(form);

  formData.append('access_key', 'bfcffd7a-e9e1-4609-a6b6-ddfa187ffefd');
  formData.append('subject', 'Nova mensagem pelo site - Liceu de Ofícios Criativos');
  formData.append('from_name', 'Site Liceu de Ofícios');

  const conteudoOriginalBtn = submitBtn.innerHTML;
  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled = true;
  if (feedback) feedback.textContent = '';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (feedback) {
        feedback.textContent = 'Mensagem enviada com sucesso! Em breve entraremos em contato.';
        feedback.style.color = '#15803d';
      }
      form.reset();
    } else if (feedback) {
      feedback.textContent = 'Não foi possível enviar a mensagem. Tente novamente.';
      feedback.style.color = '#b91c1c';
    }
  } catch {
    if (feedback) {
      feedback.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
      feedback.style.color = '#b91c1c';
    }
  } finally {
    submitBtn.innerHTML = conteudoOriginalBtn;
    submitBtn.disabled = false;
  }
});